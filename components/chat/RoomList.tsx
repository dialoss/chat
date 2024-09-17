import { formatTime } from '@/utils/dateFormat';
import RoomItem from './RoomItem'

export default function RoomList({ rooms, onRoomSelect, selectedRoomId }) {
  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar overscroll-none">
      {rooms.sort((a, b) => {
        if (a.unreadCount !== b.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }
        if (a.unreadCount === 0 && b.unreadCount === 0) {
          const aDate = a.latestMessage?.createdAt ? formatTime(a.latestMessage.createdAt, true) : new Date(0);
          const bDate = b.latestMessage?.createdAt ? formatTime(b.latestMessage.createdAt, true) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        }
        return 0;
      }).map((room) => (
        <RoomItem 
          key={room.id} 
          room={room} 
          onSelect={onRoomSelect} 
          isSelected={room.id === selectedRoomId} 
        />
      ))}
    </div>
  )
}
