import React, { useState, useEffect } from 'react';
import { Avatar, Button, Skeleton } from "@nextui-org/react";
import { FaEdit } from 'react-icons/fa';
import EditProfileModal from '../modals/EditProfileModal';
import { callApi } from "@/app/utils/api"
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isOnline: boolean;
  lastSeen: string | null;
}

const fetchUserData = async (): Promise<User | null> => {
  return await callApi('/api/users/me');
};

const UserProfile: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData().then(userData => {
      setUser(userData);
      setIsLoading(false);
    });
  }, []);

  const handleProfileUpdated = async () => {
    const userData = await fetchUserData();
    if (userData) {
      setUser(userData);
    }
    setIsEditModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 p-2">
        <Skeleton className="rounded-full h-12 w-12" />
        <div className="flex-grow">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="flex hover:bg-gray-200 cursor-pointer transition-colors duration-100 items-center space-x-2  bg-gray-100 p-2" onClick={() => setIsEditModalOpen(true)}>
        <Avatar src={user.image || undefined} alt={user.name || 'User'} className="h-12 w-12 min-w-[48px]" />
        <div className="flex-grow">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-gray-500 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</p>
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        user={user}
      />
    </>
  );
};

export default UserProfile;