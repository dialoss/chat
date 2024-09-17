'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from "next-auth/react"
import { Button } from "@nextui-org/react"
import RoomList from './RoomList'
import UserProfile from './UserProfile'
import CreateRoomModal from '../modals/CreateRoomModal'
import { FaSearch, FaBell, FaBellSlash } from 'react-icons/fa'
import SearchModal from '@/components/modals/SearchModal'
import { useSmallScreen } from '@/lib/hooks'
import { FaTimes } from 'react-icons/fa'
import { FaPlus } from 'react-icons/fa'
import { useStore } from '@/lib/store'
import { FaYandex } from 'react-icons/fa'; // Add this import
import { FaGoogle, FaGithub } from 'react-icons/fa';

interface Room {
  id: string;
  name: string;
  unreadCount: number;
  latestMessage?: {
    content: string;
    createdAt: string;
  } | null;
}

interface ChatSidebarProps {
  initialRooms: Room[];
  onRoomSelect: (room: Room) => void;
  selectedRoomId: string | null;
}

export default function wChatSidebar({ initialRooms, onRoomSelect, selectedRoomId }: ChatSidebarProps) {
	const [rooms, setRooms] = useState(initialRooms);
	const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
		if ('Notification' in window) {
			return Notification.permission === 'granted';
		  }
		  return false;
	});
	useEffect(() => {
		setRooms(initialRooms)
	}, [initialRooms])
	const isSmallScreen = useSmallScreen();
	const { isOpen, setIsOpen } = useStore();

	const toggleNotifications = () => {
		if (notificationsEnabled) {
			window.disableNotifications()
			setNotificationsEnabled(false);
		} else {
			window.enableNotifications()
			setNotificationsEnabled(true);
		}
	};

	const getProviderIcon = (provider: string) => {
		switch (provider) {
			case 'google':
				return <FaGoogle />;
			case 'github':
				return <FaGithub />;
			case 'yandex':
				return <FaYandex />;
			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col h-full bg-gray-100">
			<UserProfile />
			<div>{isSmallScreen && (
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            )}</div>
			<div className="flex flex-row p-2 space-x-2">
				<Button
					color="primary"
					isIconOnly={true}
					onClick={() => window.openModal('search', <SearchModal/>)}
				>
					<FaSearch />
				</Button>
				<Button 
					onClick={() => window.openModal('createRoom', <CreateRoomModal />)} 
					startContent={<FaPlus />}
				>
					Create Room
				</Button>
				<Button
					color="primary"
					isIconOnly={true}
					onClick={toggleNotifications}
				>
					{notificationsEnabled ? <FaBell /> : <FaBellSlash />}
				</Button>
			</div>
			<RoomList 
				rooms={rooms} 
				onRoomSelect={onRoomSelect} 
				selectedRoomId={selectedRoomId} 
			/>
		</div>
	)
}