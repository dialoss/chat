import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const { subscription, userId } = await req.json();

  try {
    await prisma.pushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
      },
    });

    return NextResponse.json({ message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { subscription, userId } = await req.json();

  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: subscription.endpoint, userId },
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
  return NextResponse.json({ message: 'Subscription deleted' });
}