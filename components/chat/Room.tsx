'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import Message from './Message'
import RoomTopBar from './RoomTopBar'
import { getRoomMembers } from '../../lib/actions'
import { callApi } from '@/app/utils/api'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: string;
  content: string;
  media?: { url: string; type: string; name: string }[];
  createdAt: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  isRead?: boolean;
  isSystemMessage?: boolean;
}

interface Room {
  id: string;
  name: string;
  unreadCount: number;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Api {
  getRooms: () => Promise<Room[]>
  getRoom: (id: string) => Promise<Room>
  createRoom: (room: Room) => Promise<Room>
  getMessages: (roomId: string, page: number, limit: number) => Promise<{ messages: Message[], nextPage: number | null, total: number }>
  createMessage: (message: Partial<Message>) => Promise<Message>
  readMessages: (messageIds: string[], roomId: string) => Promise<void>
  updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>
  getUser: (userId: string) => Promise<User>
  subscribeToRoom: (roomId: string, callbacks: {
    onInsert: (payload: any) => void,
    onUpdate: (payload: any) => void,
    onTyping: (payload: any) => void,
    onStopTyping: (payload: any) => void
  }) => RealtimeChannel
}

class SupabaseApi implements Api {
  async getRooms(): Promise<Room[]> {
    // Implementation
    return []
  }

  async getMessages(roomId: string, page: number, limit: number): Promise<{ messages: Message[], nextPage: number | null, total: number }> {
    return await callApi(`/api/messages?roomId=${roomId}&page=${page}&limit=${limit}`)
  }

  async createMessage(message: Partial<Message>): Promise<Message> {
    return await callApi('/api/messages', {
      method: 'POST',
      body: message,
    })
  }

  async readMessages(messageIds: string[], roomId: string): Promise<void> {
    await callApi('/api/messages/read', {
      method: 'POST',
      body: {
        messageIds,
        roomId,
      },
    })
  }

  async getUser(userId: string): Promise<User> {
    return await callApi(`/api/users/${userId}`)
  }

  subscribeToRoom(roomId: string, callbacks: {
    onInsert: (payload: any) => void,
    onUpdate: (payload: any) => void,
    onTyping: (payload: any) => void,
    onStopTyping: (payload: any) => void
  }): RealtimeChannel {
    const channel = supabase.channel(`room:${roomId}`)
    
    channel
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'Message',
          filter: `roomId=eq.${roomId}`
        }, 
        callbacks.onInsert
      )
      .on('broadcast', { event: 'typing' }, callbacks.onTyping)
      .on('broadcast', { event: 'stop_typing' }, callbacks.onStopTyping)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'Message', filter: `roomId=eq.${roomId}` },
        callbacks.onUpdate
      )
      .subscribe()

    return channel
  }
}

const api = new SupabaseApi()

export default function Room({ 
  room, 
  user,
}: { 
  room: Room;
  user: User; 
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [totalMessages, setTotalMessages] = useState(0)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const loadMoreMessages = async () => {
    if (!hasMore) return
    setIsLoading(true)
    const { messages: newMessages, nextPage, total } = await api.getMessages(room.id, page, 20)
    if (!nextPage) {
      setHasMore(false)
    } 
    setMessages(prevMessages => [...newMessages, ...prevMessages])
    setPage(prevPage => prevPage + 1)
    setTotalMessages(total)
    setIsLoading(false)
  }
  const [isLoading, setIsLoading] = useState(false)

  async function prepareMessage(message: object) {
    let userData = message.userId === user.id ? user : await api.getUser(message.userId)
    
    return {
      ...message,
      user: {
        id: userData.id,
        name: userData.name,
        image: userData.image
      },
    }
  }
  async function updateMessage(payload: any) {
    const updatedMessage = await prepareMessage(payload.new)
    setMessages(prevMessages => prevMessages.map(msg => msg.id !== updatedMessage.id ? msg : updatedMessage));
  }

  async function addMessage(payload: any) {
    const newMessage = await prepareMessage(payload.new)
    if (payload.new.userId !== user.id) {
      setMessages(prevMessages => [...prevMessages, newMessage])
      setTotalMessages(prevTotal => prevTotal + 1)
    }
  }

  function deleteMessage(messageId: string) {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId))
    setTotalMessages(prevTotal => prevTotal - 1)
  }

  useEffect(() => {
    setMessages([])
    setPage(1)
    setHasMore(true)
    loadMoreMessages()
    window.deleteMessage = deleteMessage

    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    channelRef.current = api.subscribeToRoom(room.id, {
      onInsert: addMessage,
      onUpdate: updateMessage,
      onTyping: ({payload}) => {
        if (payload.userId !== user.id) {
          setTypingUsers(prev => [...Array.from(new Set([...prev, payload.userName]))])
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers(prev => prev.filter(name => name !== payload.userName))
          }, 1000)
        }
      },
      onStopTyping: ({payload}) => {
        if (payload.userId !== user.id) {
          setTypingUsers(prev => prev.filter(name => name !== payload.userName))
        }
      }
    })

    return () => {
      if (channelRef.current) channelRef.current.unsubscribe()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [room.id, user.id])
 
  const sendMessage = async (content: string, media: object[]) => {
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      content,
      media: media as { url: string; type: string; name: string }[],
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name || null,
        image: user.image || null
      },
      isOptimistic: true,
      isSystemMessage: false
    }

    setMessages(prevMessages => [...prevMessages, optimisticMessage])
    
    try {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'stop_typing',
          payload: { userId: user.id, userName: user.name }
        })
      }
      const newMessage = await api.createMessage({
        content,
        media,
        userId: user.id,
        roomId: room.id,
      })
      setTypingUsers(prev => prev.filter(name => name !== user.name))
      setTotalMessages(prevTotal => prevTotal + 1)
      if (!messages.find(msg => msg.id === newMessage.id)) {
        setMessages(prevMessages => [...prevMessages.filter(msg => msg.id !== optimisticMessage.id), newMessage]);
      }
      const roomMembers = await getRoomMembers(room.id)
      for (const member of roomMembers.filter(member => member.userId !== user.id)) {
      await callApi('/api/notification', {
        method: 'POST',
        body: {
          userId: member.userId,
          url: window.location.href,
          title: 'New message from ' + user.name,
          body: newMessage.content,
        },
      })
    }
    } catch (error) {
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== optimisticMessage.id)
      )
      console.error('Failed to send message', error)
    }
  }

  const handleTyping = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, userName: user.name }
      })
    }
  }


  function readMessages(messageIds: string[]) {
    if (messageIds.length > 0) {
      api.readMessages(messageIds, room.id)
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <RoomTopBar 
        room={room}
        totalMessages={totalMessages} 
        typingUsers={typingUsers}
      />
        <BackgroundWrapper>
        <MessageList 
          isLoading={isLoading}
          messages={[...messages]} 
          currentUserId={user.id}
          loadMoreMessages={loadMoreMessages}
          hasMore={hasMore}
          page={page}
          unreadCount={room.unreadCount}
          readMessages={readMessages}
          renderMessage={(message, isCurrentUser, showUserName, showAvatar, isGrouped) => (
            <Message
              message={message}
              isCurrentUser={isCurrentUser}
              showUserName={showUserName}
              showAvatar={showAvatar}
              isGrouped={isGrouped}
            />
          )}
        />
      </BackgroundWrapper>
      <MessageInput onSendMessage={sendMessage} onTyping={handleTyping} />
    </div>
  )
}
import { useStore } from '@/lib/store'

function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  const { background } = useStore((state) => state);

  return (
    <div 
      className="flex-1 overflow-y-auto"
      style={{
        backgroundImage: background.type === 'image' ? `url(${background.image})` : 'none',
        backgroundColor: background.type === 'color' ? background.color : 'transparent',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {children}
    </div>
  )
}