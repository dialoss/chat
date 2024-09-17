import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
  }

  const skip = (page - 1) * limit

  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
  const total = await prisma.message.count({ where: { roomId } })

  return NextResponse.json({ messages, nextPage: skip + messages.length < total, total })
}

export async function POST(req: Request) {
  const { content, media, roomId, userId } = await req.json()

  const message = await prisma.message.create({
    data: {
      content,
      media,
      roomId,
      userId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  // Update the latestMessage for the room
  await prisma.room.update({
    where: { id: roomId },
    data: {
      latestMessageId: message.id
    }
  });
  
  // Update unread count for other users in the room
  await prisma.userRoom.updateMany({
    where: {
      roomId,
      userId: {
        not: userId
      }
    },
    data: {
      unreadCount: {
        increment: 1
      }
    }
  });

  return NextResponse.json(message)
}