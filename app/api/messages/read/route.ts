import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { messageIds, roomId } = await req.json()

  const updatedUserRoom = await prisma.$queryRaw`
    UPDATE "UserRoom"
    SET "unreadCount" = GREATEST(0, "unreadCount" - ${messageIds.length})
    WHERE "userId" = ${session.user.id} AND "roomId" = ${roomId}
    RETURNING "unreadCount"
  `;

  await prisma.message.updateMany({
    where: {
      id: {
        in: messageIds
      },
      roomId: roomId,
      isRead: false  // Only update messages that are not already read
    },
    data: {
      isRead: true
    }
  });

  const unreadCount = updatedUserRoom.unreadCount;
  
  return NextResponse.json({ success: true, unreadCount })
}