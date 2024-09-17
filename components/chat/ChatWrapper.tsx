'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession, Session } from 'next-auth/react'
import { Button, Input } from "@nextui-org/react"
import { signIn } from "next-auth/react"
import ChatSidebar from './ChatSidebar'
import Room from './Room'
import RegisterForm from '../auth/RegisterForm'
import { createClient } from '@supabase/supabase-js'
import { ModalManager } from '../ModalManager';
import { divide } from 'lodash'
import { useSmallScreen } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { FaBars, FaTimes } from 'react-icons/fa'
import { useLoading } from "@/lib/hooks"
import { FaArrowLeft } from 'react-icons/fa'
import { FaGoogle, FaGithub, FaYandex } from 'react-icons/fa'
import { callApi } from '@/app/utils/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Update the Room interface
interface Room {
  id: string;
  name: string;
  unreadCount: number;
  latestMessage?: {
    content: string;
    createdAt: string;
    id?: string;
  } | null;
}

// Declare global interface for Window object
declare global {
  interface Window {
    updateRoom: (updatedRoom: Partial<Room>) => void;
    joinRoom: (options: { userIds?: string[], isPrivate?: boolean, name?: string, roomId?: string, create?: boolean }) => Promise<void>;
  }
}


function useSupabaseSubscription(roomsRef: React.RefObject<Room[]>, updateRoom: (updatedRoom: Partial<Room>) => void) {
  const { data } = useSession();
  const session = useRef<Session | null>(null);
  session.current = data;

  useEffect(() => {
    const channel = supabase.channel('public:Message')
    
    channel
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'UserRoom'},
        async (payload) => {
          const updatedRoom = payload.new as any          
          if (updatedRoom.userId !== session.current?.user.id) return
          const newRoom = {
            id: updatedRoom.roomId, 
            unreadCount: updatedRoom.unreadCount
          }
          updateRoom(newRoom)
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'Room'},
        async (payload) => {
          const updatedRoom = payload.new as any          
          updateRoom(updatedRoom)
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'Message' },
        async (payload) => {
          const message = payload.new as any
          const user = await callApi(`/api/users/${message.userId}`)
          updateRoom({ id: message.roomId, latestMessage: { ...message, user } })
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'Message' },
        async (payload) => {
          const updatedMessage = payload.new as any
          const room = roomsRef.current?.find(r => r.id === updatedMessage.roomId)
          if (updatedMessage.id === room?.latestMessage?.id) {
            const user = await callApi(`/api/users/${updatedMessage.userId}`)
            updateRoom({ id: updatedMessage.roomId, latestMessage: { ...updatedMessage, user } })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])
}

function useOnlineStatus() {
  useEffect(() => {
    const updateOnlineStatus = async (isOnline: boolean) => {
      const blob = new Blob([JSON.stringify({ isOnline })], { type: 'application/json; charset=UTF-8' });
      navigator.sendBeacon('/api/users/update-status', blob);
    };

    updateOnlineStatus(true);

    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, []);
}

const AuthForm = () => {
  const [isRegistering, setIsRegistering] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn('credentials', { email, password, callbackUrl: '/' })
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await callApi('/api/auth/reset-password', {
        method: 'POST',
        body: { email },
      })
        alert('Password reset email sent. Please check your inbox.')
        setIsForgotPassword(false)
      
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await callApi('/api/auth/reset-password', {
        method: 'POST',
        body: { email, resetToken, newPassword },
      })
        alert('Password has been reset successfully. You can now sign in with your new password.')
        setIsResetPassword(false)
   
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const { isLoading, call } = useLoading(handleSignIn)

  if (isForgotPassword) {
    return (
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" color="primary">Send Reset Email</Button>
        </form>
        <p className="mt-4">
          <button onClick={() => setIsForgotPassword(false)} className="text-blue-500">
            Back to Sign In
          </button>
        </p>
      </div>
    )
  }

  if (isResetPassword) {
    return (
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Reset Token"
            type="text"
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button type="submit" color="primary">Reset Password</Button>
        </form>
        <p className="mt-4">
          <button onClick={() => setIsResetPassword(false)} className="text-blue-500">
            Back to Sign In
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-2">
      {isRegistering ? (
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Register</h2>
          <RegisterForm />
          <p className="mt-4">
            Already have an account?{' '}
            <button onClick={() => setIsRegistering(false)} className="text-blue-500">
              Sign in
            </button>
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>
          <form className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" color="primary" isLoading={isLoading} onClick={call}>Sign In</Button>
          </form>
          <p className="mt-4">
            Don't have an account?{' '}
            <button onClick={() => setIsRegistering(true)} className="text-blue-500">
              Register
            </button>
          </p>
          <p className="mt-2">
            <button onClick={() => setIsForgotPassword(true)} className="text-blue-500">
              Forgot Password?
            </button>
          </p>
          <p className="mt-2">
            <button onClick={() => setIsResetPassword(true)} className="text-blue-500">
              Reset Password
            </button>
          </p>
        </div>
      )}
           
      <div className="flex flex-col space-y-2 mt-4">
        <Button onClick={() => signIn('google')} startContent={<FaGoogle />}>
          Continue with Google
        </Button>
        <Button onClick={() => signIn('github')} startContent={<FaGithub />}>
          Continue with GitHub
        </Button>
        <Button onClick={() => signIn('yandex')} startContent={<FaYandex />}>
          Continue with Yandex
        </Button>
      </div>
    </div>
  )
}

const ChatContent = ({ isSidebarOpen, sidebarRef, rooms, currentRoom, session }: { isSidebarOpen: boolean, sidebarRef: React.RefObject<HTMLDivElement>, rooms: Room[], currentRoom: Room | null, session: Session }) => {
  const isSmallScreen = useSmallScreen();
  const searchParams = useSearchParams()
  const roomId = searchParams?.get('roomId');
  const { isOpen, setIsOpen } = useStore();

  const {isLoading, call} = useLoading(() => window.joinRoom({ roomId }));
  return (
    <>
    {!currentRoom && <div className="bg-gray-200 p-2">
        <div className="flex flex-col">
          <div className='flex justify-between items-center'>
            <div className="mr-2">
              {isSmallScreen && (
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full w-[40px] h-[40px] shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center"
                >
                  {isOpen ? (
                    <FaTimes className="w-5 h-5" />
                  ) : (
                    <FaBars className="w-5 h-5" />
                  )}
                </button>
            )}      
          </div>
        </div>
      </div>
    </div>}
      
    <div className="flex-1 flex overflow-hidden w-screen">
      
      <div 
        ref={sidebarRef}
        className={`
          ${isSmallScreen ? 'fixed inset-y-0 left-0 z-40 w-64' : 'w-1/4 min-w-[250px]'}
          ${isSmallScreen ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
          transition-transform duration-300 ease-in-out z-100
        `}
      >
        <ChatSidebar 
          initialRooms={rooms} 
          onRoomSelect={room => window.joinRoom({roomId: room.id})} 
          selectedRoomId={currentRoom?.id || null}
        />
        
      </div>
      <div className={`flex-1 w-full relative`}>
        <div className={`absolute top-0 left-0 w-full h-full bg-black opacity-0 ${isSmallScreen && isSidebarOpen ? 'opacity-20' : 'hidden'}`}></div>
        <div className={`w-full h-full ${isSmallScreen && isSidebarOpen ? 'pointer-events-none' : ''}`}>
        {!currentRoom && roomId ? (
          <div className="flex items-center justify-center h-full">
            <Button onClick={call} isLoading={isLoading} color="primary">Join room {roomId}</Button>
          </div>
        ) :
        currentRoom && session?.user ? (
          <Room
            key={currentRoom.id}
            room={currentRoom}
            user={session.user} 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            Select a room to start chatting
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  )
}

function ChatContentWrapper({ initialRooms }: { initialRooms: Room[] }) {
  const { data: session, status } = useSession()

  const router = useRouter()
  const searchParams = useSearchParams()
  const isSmallScreen = useSmallScreen()

  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const roomsRef = useRef<Room[]>([])
  roomsRef.current = rooms

  function updateRoom(updatedRoom: Partial<Room>) {
    let id = updatedRoom.id || currentRoom;
    setRooms((prevRooms: Room[]) => 
      prevRooms.map((room: Room) => 
        room.id === id ? { ...room, ...updatedRoom } : room
      )
    );
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateRoom = updateRoom;
    }
  }, [currentRoom]);

  useSupabaseSubscription(roomsRef, updateRoom)
  useOnlineStatus()

  const sidebarRef = useRef<HTMLDivElement>(null)
  const roomId = searchParams?.get('roomId')
  const { isOpen, toggle, setIsOpen } = useStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSmallScreen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSmallScreen])

  function changeRoom(roomId: string | null) {
    if (roomId !== null) router.push(`/?roomId=${roomId}`);
    setCurrentRoom(roomId)    
  }

  useEffect(() => {
    changeRoom(roomId)
  }, [roomId])

  useEffect(() => {
    window.joinRoom = async ({ userIds, isPrivate, name, roomId, create }: { userIds?: string[], isPrivate?: boolean, name?: string, roomId?: string, create?: boolean }) => {

      if (rooms.find(r => r.id === roomId)) {
        changeRoom(roomId);
        return
      }

      const {room} = await callApi('/api/rooms/join', {
        method: 'POST',
        body: { roomId, name, userIds, isPrivate, create },
      });

      if (!rooms.find(r => r.id === room.id)) setRooms(prevRooms => [...prevRooms, room]);

      changeRoom(room.id);
    }
  }, [])

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return <AuthForm/>
  }

  return (
    <div className="h-full flex flex-col">
      <ChatContent 
        isSidebarOpen={isOpen}
        sidebarRef={sidebarRef}
        rooms={rooms}
        currentRoom={rooms.find(r => r.id === currentRoom) || null}
        session={session}
      />
      <ModalManager /> 
    </div>
  )
}

export default function ChatWrapper({ initialRooms }: { initialRooms: Room[] }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContentWrapper initialRooms={initialRooms} />
    </Suspense>
  )
}