import React, { useState, useRef, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Avatar } from "@nextui-org/react";
import ReactAvatarEditor from 'react-avatar-editor';
import { signOut } from 'next-auth/react';
import { FaSignOutAlt } from 'react-icons/fa';
import { callApi } from "@/app/utils/api"
import { useLoading } from "@/lib/hooks";
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  lastSeen: string | null;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
  user: User;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onProfileUpdated, user }) => {
  const [name, setName] = useState(user.name || '');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<ReactAvatarEditor | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    let avatarUrl = user.image;

    if (newAvatar && editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, 'image/png'));
      
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.png');

      const uploadResponse = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const { url } = await uploadResponse.json();
        avatarUrl = url;
      } else {
        console.error('Failed to upload avatar');
        // You might want to show an error message to the user here
      }
    }

    const response = await callApi('/api/user/update', {
      method: 'POST',
      body: { name, image: avatarUrl },
    });

      onProfileUpdated();
      onClose();
    
  };

  const { isLoading, call } = useLoading(() => handleSubmit())
  const { isLoading: isLoadingSignOut, call: callSignOut } = useLoading(() => signOut())

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center space-y-4">
            {avatarPreview ? (
              <ReactAvatarEditor
                ref={editorRef}
                image={avatarPreview}
                width={250}
                height={250}
                border={50}
                color={[255, 255, 255, 0.6]} // RGBA
                scale={1.2}
                rotate={0}
              />
            ) : (
              <Avatar
                src={user.image || undefined}
                alt={user.name || 'User'}
                className="w-24 h-24"
              />
            )}
            <Button onClick={() => fileInputRef.current?.click()}>
              Change Avatar
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={callSignOut} size="sm" color="danger" isLoading={isLoadingSignOut} isIconOnly={true} startContent={<FaSignOutAlt />} />
          <Button color="danger" variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={call} isLoading={isLoading}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfileModal;