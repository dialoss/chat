import ResetPasswordForm from '../../components/ResetPasswordForm';
import { Suspense } from 'react';
export default function ResetPasswordPage() {
  return (
    <div>
      <h1>Reset Password</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}