import { Badge, Button, Avatar } from "@nextui-org/react"
import { formatTime } from '@/utils/dateFormat'
import { TbChecks } from 'react-icons/tb'
import { FaCheck } from 'react-icons/fa'
import { twMerge } from "tailwind-merge"
import { useSession } from "next-auth/react"
import { useStore } from "@/lib/store"

interface LatestMessage {
  content: string;
  createdAt: string;
  isSystemMessage?: boolean;
  user: {
    name: string;
    image: string | null;
    id: string;
  };
  isRead: boolean;
}

interface Room {
  id: string;
  name: string;
  latestMessage?: LatestMessage;
  unreadCount: number;
}

interface RoomItemProps {
  room: Room;
  onSelect: (room: Room) => void;
  isSelected: boolean;
}

export default function RoomItem({ room, onSelect, isSelected }: RoomItemProps) {
  const hasUnreadMessages = room.unreadCount > 0;
  const { data: session } = useSession();
  const isCurrentUser = room.latestMessage?.user && room.latestMessage?.user.id === session?.user?.id;
  return (
    <div 
      id={room.id}
      className={twMerge(
        "flex items-center p-2 cursor-pointer",
        isSelected ? "bg-blue-100" : "hover:bg-gray-200 transition-colors",
        hasUnreadMessages && "bg-gray-300"
      )}
      onClick={() => {
        onSelect(room)
        useStore.getState().setIsOpen(false)
      }}
    >
      <Avatar 
        src={room.latestMessage?.user.image || ''} 
        alt={room.name}
        className="w-12 h-12 min-w-12 mr-3"
      />
      <div className="flex-grow overflow-hidden">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-sm truncate">{room.name}</span>
          {room.latestMessage && (
            <span className="text-xs text-gray-500 ml-2">
              {formatTime(room.latestMessage.createdAt)}
            </span>
          )}
        </div>
        {room.latestMessage && (
          <div className="flex items-center">
            <p className={`text-sm truncate ${hasUnreadMessages ? 'font-medium text-black' : 'text-gray-500'}`}>
              {room.latestMessage.content ? room.latestMessage.content : 'Media'}
            </p>
            {isCurrentUser && <span className="ml-auto text-gray-400">
              {room.latestMessage.isRead ? <TbChecks color='#32CD32' size={15}/> : <FaCheck size={14}/>}
            </span>}
            {hasUnreadMessages && (
              <div className="ml-auto">
                <Badge content={room.unreadCount} color="primary" size="sm" className="mr-2" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}