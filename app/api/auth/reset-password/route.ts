import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });


async function sendResetPasswordEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const text = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
    Please click on the following link, or paste this into your browser to complete the process:\n\n
    ${resetUrl}\n\n
    If you did not request this, please ignore this email and your password will remain unchanged.\n`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: subject,
      text: text,
    });
  } catch (error) {
    console.error('Failed to send reset password email:', error);
    throw new Error('Failed to send reset password email');
  }
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetPasswordExpires,
      },
    });

    await sendResetPasswordEmail(user.email, resetToken);

    return NextResponse.json({ message: 'Reset password email sent' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}