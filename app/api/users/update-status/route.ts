import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { isOnline } = await req.json();
  const data = {isOnline, lastSeen: new Date()};
  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data
  });

  return NextResponse.json(updatedUser);
}