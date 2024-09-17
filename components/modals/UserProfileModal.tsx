import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Avatar, Button, Skeleton } from "@nextui-org/react";
import { formatDistanceToNow } from 'date-fns';
import { formatTime } from '@/utils/dateFormat';
import { FaPaperPlane } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { callApi } from "@/app/utils/api"
interface UserProfileModalProps {
  userId: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId }) => {
  const [user, setUser] = React.useState<{
    id: string;
    image: string | null;
    name: string;
    email: string;
    isOnline: boolean;
    lastSeen: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const currentUser = useSession().data?.user;

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const userData = await callApi(`/api/users/${userId}/details`);
          setUser(userData);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div>
        <ModalHeader className="flex flex-col items-center">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-6 w-32 mt-2" />
        </ModalHeader>
        <ModalBody>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-10 w-full mt-4" />
        </ModalBody>
      </div>
    );
  }

  if (!user) return null;

  const lastSeenDate = user.lastSeen ? formatTime(user.lastSeen, true) : null;

  return (
    <div>
      <ModalHeader className="flex flex-col items-center">
        <Avatar 
            src={user.image || undefined} 
            className={`w-24 h-24 ${user.isOnline ? 'ring-2 ring-offset-2 ring-green-500' : 'ring-2 ring-offset-2 ring-blue-500'}`} 
          />          
          <h2 className="text-xl font-bold mt-2">{user.name}</h2>
        </ModalHeader>
        <ModalBody>
          <p><strong>Email:</strong> {user.email}</p>
          <p>
            <strong>Status:</strong> {user.isOnline ? 'Online' : 'Offline'}
          </p>
          {!user.isOnline && lastSeenDate && (
            <p>
              <strong>Last seen:</strong> {formatDistanceToNow(lastSeenDate, { addSuffix: true })}
            </p>
          )}
          <Button 
            color="primary" 
            onClick={() => window.joinRoom({ userIds: [user.id, currentUser?.id], isPrivate: true, name: `Чатик ${user.name} и ${currentUser?.name}` })} 
            className="mt-4 w-full"
            isIconOnly={true}
            variant="light"
            startContent={<FaPaperPlane size={20}/>}
          >
          </Button>
        </ModalBody>
    </div>
  );
};

export default UserProfileModal;