import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { name, image } = await req.json()

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, image },
  })

  return NextResponse.json(updatedUser)
}