'use client'

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from '@nextui-org/react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { callApi } from "@/app/utils/api"
function NotificationProvider() {
  const { data: session } = useSession();

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) return;
   
    window.enableNotifications = () => enableNotifications(userId)
    window.disableNotifications = () => disableNotifications(userId)
    window.registerServiceWorker = () => navigator.serviceWorker.register('/sw.js')
   
  }, [userId]);

  const enableNotifications = async (userId: string) => {
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers are not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered');

      const permission = await Notification.requestPermission();
      console.log(permission)
      if (permission === 'granted') {

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: "BNtdTAcThQMust8IphvCgjc7pqbZj6w97R7Vh2OLHgKAocx26-pbPJz7ir0wVkbdM0aRFDR0q_uMuc1JK96JCJY",
        });
        await callApi('/api/push-subscription', {
          method: 'POST',
          body: {
            subscription,
            userId,
          },
        });
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
    }
  };
    const disableNotifications = async (userId: string) => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await callApi('/api/push-subscription', {
          method: 'DELETE',
          body: {
            subscription,
            userId,
          },
        });
      }
    } catch (err) {
      console.error('Error disabling notifications:', err);
    }
  };

  return (
    <></>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  
  return <SessionProvider>
  <NextUIProvider>
  <NotificationProvider/>

    {children}
  </NextUIProvider>
</SessionProvider>;
}