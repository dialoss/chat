'use server'

import prisma from '@/lib/prisma'
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:redshock75@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function updateRoom(id: string, name: string) {
  if (name.trim() === '') {
    throw new Error('Room name cannot be empty')
  }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { name },
    })
}

export async function getUserStatus(userId: string) {
    if (!userId) {
        return {
            isOnline: false,
            lastSeen: null,
        }
    }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isOnline: true,
      lastSeen: true,
    }
  })
  return user
}

export async function getUsersFromRoom(roomId: string) {
  const users = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      members: {
        select: {
          userId: true,
        }
      }
    }
  })
  return users
}


export async function deleteMessage(messageId: string) {
  await prisma.message.delete({
    where: { id: messageId },
  })
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string) {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    });

    for (const sub of subscriptions) {
    await webpush.sendNotification(
        {
        endpoint: sub.endpoint,
        keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
            },
        },
        JSON.stringify({ title, body, url })
    );
}
}

export async function getRoomMembers(roomId: string) {
    const members = await prisma.room.findUnique({
        where: { id: roomId },
        select: {
            members: {
                select: {
                    userId: true,
                }
            }
        }
    })
    return members?.members || []
}

export async function getRoomDetails(roomId: string) {
    const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: {
            id: true,
            name: true,
            createdAt: true,
            isPrivate: true,
            image: true,
            _count: {
                select: {
                    messages: true
                }
            },
            members: {
                select: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            isOnline: true,
                            lastSeen: true,
                        }
                    }
                }
            }
        }
    })
    return room
}