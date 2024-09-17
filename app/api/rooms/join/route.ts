import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const include = {
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
    members: {
      where: {
        userId: session?.user?.id
      },
      select: {
        unreadCount: true
      }
    }
  }
  
  let { roomId, name, userIds, isPrivate, create } = await request.json();

  if (!isPrivate) isPrivate = false;

  if (!roomId && userIds && userIds.length > 0) {
    const existingRoom = await prisma.room.findFirst({
      where: {
        isPrivate,
        members: {
          every: {
            userId: {
              in: userIds
            }
          }
        }
      },
      include
    });
    let room;

    if (existingRoom && !create) {
      room = existingRoom;
    } else {
      room = await prisma.room.create({
        data: {
          name: name || `Private Room`,
          isPrivate,
          members: {
            create: userIds.map(userId => ({ userId }))
          },
        },
        include
      });
    }
    return NextResponse.json({ success: true, room });
  }

  // Check if the user is already in the room
  const existingUserRoom = await prisma.userRoom.findUnique({
    where: {
      userId_roomId: {
        userId: session.user.id,
        roomId,
      },
    },
  });

  if (!existingUserRoom) {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        roomId: roomId,
        isRead: false,
      }
    })

    await prisma.userRoom.create({
      data: {
        userId: session.user.id,
        roomId,
        unreadCount
      },
    })

    await prisma.message.create({
      data: {
        content: `${session.user.name} has joined the room`,
        roomId: roomId,
        userId: session.user.id,
        isSystemMessage: true,
      },
      include: {
        user: {
          select: {
            id: true,
            image: true,
            name: true,
          }
        }
      }
    })
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
  const room = await prisma.room.findUnique({
    where: {
      id: roomId
    },
    include
  })
  return NextResponse.json({ success: true, room });
}