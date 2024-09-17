import React, { useState, useEffect } from 'react'
import TypingIndicator from './TypingIndicator'
import { Button } from '@nextui-org/react'
import { FaShare } from 'react-icons/fa'
import EditRoomModal from '../modals/EditRoomModal'
import { IoSettingsOutline } from 'react-icons/io5'
import { useSmallScreen } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { FaTimes, FaBars } from 'react-icons/fa'
import { FaCircle } from 'react-icons/fa'
import { useSession } from 'next-auth/react'
import { getUsersFromRoom, getUserStatus } from '@/lib/actions'
import RoomInfoModal from '../modals/RoomInfoModal'
import { formatDistanceToNow } from 'date-fns'

interface RoomTopBarProps {
  room: {
    id: string
    name: string
    totalMessages: number
    isPrivate: boolean
  }
  typingUsers: string[]
  totalMessages: number

}

export default function RoomTopBar({ room, totalMessages, typingUsers }: RoomTopBarProps) {
  const [isUserOnline, setIsUserOnline] = useState<boolean>(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }
  const isSmallScreen = useSmallScreen();
  const { isOpen, setIsOpen } = useStore();
  const {data: session} = useSession();

  useEffect(() => {

    let intervalId: NodeJS.Timeout | null = null;
    async function init() {
      const users = await getUsersFromRoom(room.id)
      if (users) {
        return users.members.find(member => member.userId !== session?.user?.id)?.userId
      }
    }
    init().then((otherUserId) => {
      const fetchUserStatus = async () => {
        if (room.isPrivate && otherUserId) {
          try {
            const data = await getUserStatus(otherUserId);
            setIsUserOnline(data.isOnline)
            setLastSeen(data.lastSeen)
          } catch (error) {
            console.error('Failed to fetch user status:', error)
          }
        }
      }
  
      fetchUserStatus()
      intervalId = setInterval(fetchUserStatus, 10000) // Fetch every 10 seconds
    })

    return () => clearInterval(intervalId) // Clean up on unmount
  }, [room.isPrivate])

  return (
    <div className="bg-gray-200 p-2">
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
          <div className="flex items-center hover:cursor-pointer" onClick={() => window.openModal('roomInfo', <RoomInfoModal room={room} />)}>
            <h2 className="text-md font-bold">{room.name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            {!room.isPrivate && <Button 
              size="sm"
              variant="light"
              isIconOnly={true}
              onClick={copyShareLink}
            >
              <FaShare size={20}/>
            </Button>
            }
            <Button 
              size="sm"
              isIconOnly={true}
              onClick={() => window.openModal('editRoom', <EditRoomModal room={room}></EditRoomModal> )}
              variant="light"
            >
              <IoSettingsOutline size={20}/>
            </Button>
          </div>
        </div>
        <div className='flex justify-center'>
          {typingUsers.length > 0 ? <TypingIndicator typingUsers={typingUsers} /> : room.isPrivate && (
              <span className="text-sm">
                {isUserOnline ? (
                  <p className='text-green-500'>online</p>
                ) : (
                  <p className='text-gray-500'>
                    {lastSeen ? `Last seen: ${formatDistanceToNow(lastSeen, { addSuffix: true })}` : 'offline'}
                  </p>
                )}
              </span>
            )}
          {/* <span className="text-sm text-gray-600 ml-auto">{totalMessages} messages</span> */}
        </div>
      </div>
    </div>
  )
}