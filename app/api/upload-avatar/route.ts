import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('avatar') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  
  // Resize the image
  const resizedBuffer = await sharp(Buffer.from(buffer))
    .resize({ width: 200, height: 200, fit: 'cover' })
    .toBuffer();

  const fileName = `${Date.now()}.webp`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, resizedBuffer, {
      contentType: 'image/webp',
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}