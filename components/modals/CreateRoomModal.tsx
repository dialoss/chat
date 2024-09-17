import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Checkbox } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { useLoading } from "@/lib/hooks";
import { useStore } from '@/lib/store';

const createRoom = async (name: string, userIds: string[], isPrivate: boolean) => {
  if (name.trim() === '') return;
  await window.joinRoom({ name, userIds, create: true, isPrivate });
  window.closeModal('createRoom');
};

const CreateRoomModal: React.FC = () => {
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  const { data: session } = useSession();
  const { isLoading, call } = useLoading(() => createRoom(newRoomName, [session?.user?.id || ''], isPrivate));

  return (
    <div>
      <ModalHeader>Create a New Room</ModalHeader>
      <ModalBody>
        <Input
          placeholder="Enter room name"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              call();
            }
          }}
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <Checkbox
          isSelected={isPrivate}
          onValueChange={setIsPrivate}
          className="mt-2"
        >
          Private Room
        </Checkbox>
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="light" onClick={() => window.closeModal('createRoom')}>
          Cancel
        </Button>
        <Button color="primary" isLoading={isLoading} onClick={call}>
          Create
        </Button>
      </ModalFooter>
    </div>
  );
};

export default CreateRoomModal;