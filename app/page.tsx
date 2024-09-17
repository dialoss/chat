import ChatWrapper from '@/components/chat/ChatWrapper'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { routeModule } from 'next/dist/build/templates/app-page.js'

export default async function Home() {
  const session = await getServerSession(authOptions)
  const rooms = await prisma.room.findMany({
    where: {
      members: {
        some: {
          userId: session?.user?.id
        }
      }
    },
    include: {
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
    },
  })
  
  const formattedRooms = rooms.map(room => ({
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    image: room.image,
    latestMessage: room.latestMessage,
    unreadCount: room.members[0]?.unreadCount || 0
  }))

  return (
    <main className="h-[100dvh]">
      <ChatWrapper initialRooms={formattedRooms} />
    </main>
  )
}
