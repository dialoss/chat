import React, { useState } from 'react'
import { ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Tabs, Tab } from "@nextui-org/react"
import { Avatar } from '@nextui-org/react'
import UserProfileModal from '@/components/modals/UserProfileModal'
import { FaEnvelope } from 'react-icons/fa'
import { useSession } from "next-auth/react"
import UniversalSearch from '@/components/modals/UniversalSearch'
import { formatDate } from "@/utils/dateFormat"
import { useLoading } from "@/lib/hooks"

interface Room {
  id: string;
  name: string;
  isJoined: boolean;
  latestMessage?: {
    content: string;
    createdAt: string;
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
}

const SearchModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'users' | 'onlineUsers'>('rooms')

  function onRoomSelect(room: Room) {
    window.joinRoom({ roomId: room.id})
    window.closeModal('search')
  }
  const { data: session } = useSession()

  async function createRoomWithUser(otherUser: User) {
      await window.joinRoom({ userIds: [session?.user?.id, otherUser.id], isPrivate: true, name: `Чатик ${otherUser.name} и ${session?.user?.name}` })
      window.closeModal('search')
  }

  const {isLoading, call} = useLoading((user: User) => createRoomWithUser(user))

  return (
    <div>
      <ModalHeader className="flex flex-col gap-1">Search</ModalHeader>
      <ModalBody>
        <Tabs
          aria-label="Search options"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as 'rooms' | 'users' | 'onlineUsers')}
        >
          <Tab key="rooms" title="Rooms">
            <UniversalSearch<Room>
              apiPath="/api/rooms/search"
              placeholder="Search rooms..."
              onSelect={onRoomSelect}
              renderItem={(room: Room) => (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{room.name}</h3>
                    {room.latestMessage && (
                      <p className="text-sm text-gray-500">
                        {room.latestMessage.content.substring(0, 50)}...
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {formatDate(room.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            />
          </Tab>
          <Tab key="users" title="All Users">
            <UniversalSearch<User>
              apiPath="/api/users/search"
              placeholder="Search users..."
              onSelect={(user: User) => window.openModal('userProfile', <UserProfileModal userId={user.id} />)}
              renderItem={(user: User) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar
                      src={user.image || undefined}
                      alt={user.name || 'User'}
                      className="mr-3"
                      size="sm"
                    />
                    <div>
                      <h3 className="font-bold">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    color="primary"
                    isLoading={isLoading}
                    aria-label="Send message"
                    onClick={(e) => {
                      e.stopPropagation();
                      call(user);
                    }}
                  >
                    <FaEnvelope />
                  </Button>
                </div>
              )}
            />
          </Tab>
          <Tab key="onlineUsers" title="Online Users">
            <UniversalSearch<User>
              apiPath="/api/users/search?online=true"
              placeholder="Search online users..."
              showSearch={false}
              onSelect={(user: User) => window.openModal('userProfile', <UserProfileModal userId={user.id} />)}
              renderItem={(user: User) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar
                      src={user.image || undefined}
                      alt={user.name || 'User'}
                      className="mr-3"
                      size="sm"
                    />
                    <div>
                      <h3 className="font-bold">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    color="primary"
                    isLoading={isLoading}
                    aria-label="Send message"
                    onClick={(e) => {
                      e.stopPropagation();
                      call(user);
                    }}
                  >
                    <FaEnvelope />
                  </Button>
                </div>
              )}
            />
          </Tab>
        </Tabs>
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="light" onPress={() => window.closeModal('search')}>
          Close
        </Button>
      </ModalFooter>
    </div>
  )
}

export default SearchModal