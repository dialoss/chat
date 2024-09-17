import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { getRoomDetails } from "@/lib/actions";
import { formatDistanceToNow } from 'date-fns';
import { formatDate } from "@/utils/dateFormat";
import { Room } from "@prisma/client";
import UserProfileModal from "./UserProfileModal";

interface RoomInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export default function RoomInfoModal({ room }: RoomInfoModalProps) {
  const [roomDetails, setRoomDetails] = React.useState<Room | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRoomDetails = async () => {
      setIsLoading(true);
      const data = await getRoomDetails(room.id);
      setRoomDetails(data);
      setIsLoading(false);
    };

    fetchRoomDetails();
  }, [room.id]);

  if (isLoading) {
    return (
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </ModalBody>
      </ModalContent>
    );
  }
  console.log(roomDetails)
  return (
    <ModalContent>
      <ModalHeader className="flex flex-col gap-1">Group Info</ModalHeader>
      <ModalBody>
        <div className="flex items-center mb-4">
          <img
            src={roomDetails.image || '/default-group-avatar.png'}
            alt={`${roomDetails.name} avatar`}
            className="w-16 h-16 rounded-full mr-4"
          />
          <div>
            <h2 className="text-xl font-bold">{roomDetails.name}</h2>
            <p className="text-sm text-gray-500">{roomDetails.members.length} members</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm"><strong>Created:</strong> {formatDate(roomDetails.createdAt)}</p>
          <p className="text-sm"><strong>Total Messages:</strong> {roomDetails._count.messages}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm mb-2"><strong>Media:</strong></p>
          <div className="flex space-x-4">
            <div className="text-center">
              <p className="font-bold">{roomDetails.photoCount || 120}</p>
              <p className="text-xs">photos</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{roomDetails.videoCount || 5}</p>
              <p className="text-xs">videos</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{roomDetails.fileCount || 54}</p>
              <p className="text-xs">files</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{roomDetails.audioCount || 1}</p>
              <p className="text-xs">audio file</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm mb-2"><strong>{roomDetails.members.length} Members:</strong></p>
          <ul className="space-y-2">
            {roomDetails.members.map((member) => (
              <li key={member.user.id} className="flex items-center justify-between hover:bg-gray-100 rounded cursor-pointer p-2" onClick={() => window.openModal('userProfile', <UserProfileModal userId={member.user.id} />)}>
                <div className="flex items-center">
                  <img
                    src={member.user.image || '/default-avatar.png'}
                    alt={`${member.user.name}'s avatar`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div className="flex flex-col">
                    <span>{member.user.name}</span>
                    {member.user.isOnline ? (
                      <span className="text-xs text-green-500">online</span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {`Last seen ${formatDistanceToNow(member.user.lastSeen, { addSuffix: true })}`}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onPress={() => window.closeModal('roomInfo')}>
          Close
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}