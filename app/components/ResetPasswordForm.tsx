'use client'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { callApi } from '@/app/utils/api';

export default function ResetPasswordForm() {
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await callApi('/api/auth/update-password', {
        method: 'POST',
        body: { resetToken, newPassword },
      });
    
      setMessage('Password reset successful.');
    setTimeout(() => router.push('/auth/signin'), 3000);
   
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="hidden"
        value={resetToken}
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Enter new password"
        required
      />
      <button type="submit">Reset Password</button>
      {message && <p>{message}</p>}
    </form>
  );
}