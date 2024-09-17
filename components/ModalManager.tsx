import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react";

interface ModalInfo {
  id: string;
  content: React.ReactNode;
  isOpen: boolean;
}

export const ModalManager: React.FC = () => {
  const [modals, setModals] = useState<ModalInfo[]>([]);

  useEffect(() => {
    // Add the openModal function to the window object
    (window as any).openModal = (id: string, content: React.ReactNode) => {
      setModals(prevModals => [
        ...prevModals.filter(modal => modal.id !== id),
        { id, content, isOpen: true }
      ]);
    };

    // Add the closeModal function to the window object
    (window as any).closeModal = (id: string) => {
      setModals(prevModals => prevModals.map(modal => 
        modal.id === id ? { ...modal, isOpen: false } : modal
      ));
    };

    // Cleanup
    return () => {
      delete (window as any).openModal;
      delete (window as any).closeModal;
    };
  }, []);

  const handleClose = (id: string) => {
    setModals(prevModals => prevModals.map(modal => 
      modal.id === id ? { ...modal, isOpen: false } : modal
    ));
  };

  return (
    <>
      {modals.map(modal => (
        <Modal key={modal.id} isOpen={modal.isOpen} onClose={() => handleClose(modal.id)} placement="center">
          <ModalContent>
            {modal.content}
          </ModalContent>
        </Modal>
      ))}
    </>
  );
};