import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/actions';

export async function POST(request: Request) {

    const { userId, title, body, url } = await request.json();
    console.log(userId, title, body, url)
    try {
        await sendPushNotification(userId, title, body, url)
    } catch (error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  
}