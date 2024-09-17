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
  const online = searchParams.get('online') === 'true'

  if (!online && !query) {
    return NextResponse.json({ error: 'Query parameter is required when not searching for online users' }, { status: 400 })
  }

  try {
    const whereClause = online
      ? { isOnline: true }
      : {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }

    const users = await prisma.user.findMany({
      where: {
        ...whereClause,
        NOT: {
          id: session.user.id,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isOnline: true,
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { name: 'asc' },
    })

    const totalCount = await prisma.user.count({
      where: {
        ...whereClause,
        NOT: {
          id: session.user.id,
        },
      },
    })

    const hasMore = totalCount > page * pageSize

    return NextResponse.json({
      items: users,
      hasMore,
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}