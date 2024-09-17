import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 10 // Number of results per page

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const rooms = await prisma.room.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        isPrivate: false, // Only search for non-private rooms
      },
      select: {
        id: true,
        createdAt: true,
        latestMessage: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        name: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            isRead: true,
          },
        },
        members: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { name: 'asc' },
    })

    const totalCount = await prisma.room.count({
      where: {
        name: { contains: query, mode: 'insensitive' },
        isPrivate: false, // Count only non-private rooms
      },
    })

    const hasMore = totalCount > page * pageSize

    const formattedRooms = rooms.map(room => ({
      ...room,
      isJoined: room.members.length > 0,
    }))

    return NextResponse.json({
      items: formattedRooms,
      hasMore,
    })
  } catch (error) {
    console.error('Error searching rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}