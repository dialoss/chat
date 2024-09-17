interface Window {
  openModal: (id: string, content: React.ReactNode) => void;
  closeModal: (id: string) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  joinRoom: (data: { roomId?: string, userIds?: string[], isPrivate?: boolean, name?: string, create?: boolean }) => void;
  enableNotifications: () => void;
  disableNotifications: () => void;
  registerServiceWorker: () => void;
}