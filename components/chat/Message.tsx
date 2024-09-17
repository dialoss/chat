import { Avatar, ModalContent, Button } from "@nextui-org/react";
import { TbChecks } from "react-icons/tb";
import { FaFile, FaDownload, FaCheck, FaPlay, FaPause } from 'react-icons/fa';
import { formatTime } from '../../utils/dateFormat';
import bytes from 'bytes';
import UserProfileModal from '@/components/modals/UserProfileModal'
import { twMerge } from 'tailwind-merge';
import { PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { FaReply, FaCopy, FaTrash } from 'react-icons/fa';
import { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import { createContext } from 'react';

interface MediaGalleryContextType {
  isOpen: boolean;
  openGallery: (media: { url: string; type: string }[], initialIndex: number) => void;
  closeGallery: () => void;
  currentMedia: { url: string; type: string }[];
  currentIndex: number;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setFullscreenMedia: (media: { url: string; type: string }[]) => void;
  fullscreenIndex: number;
  setFullscreenIndex: (index: number) => void;
}

const MediaGalleryContext = createContext<MediaGalleryContextType | undefined>(undefined);

export const MediaGalleryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<{ url: string; type: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: string }[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const openGallery = (media: { url: string; type: string }[], initialIndex: number) => {
    setCurrentMedia(media);
    setCurrentIndex(initialIndex);
    setIsOpen(true);
  };

  const closeGallery = () => {
    setIsOpen(false);
  };

  return (
    <MediaGalleryContext.Provider value={{ 
      isOpen, 
      openGallery, 
      closeGallery, 
      currentMedia, 
      currentIndex,
      setIsFullscreen,
      setFullscreenMedia,
      fullscreenIndex,
      setFullscreenIndex
    }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
          <Swiper
            modules={[Navigation, Pagination, Zoom]}
            navigation
            pagination={{ clickable: true }}
            zoom
            initialSlide={currentIndex}
            onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
          >
            {currentMedia.map((item, index) => (
              <SwiperSlide key={index}>
                <div className="swiper-zoom-container">
                  {item.type.startsWith('image/') ? (
                    <img src={item.url} alt={`Media ${index}`} className="max-w-full max-h-full" />
                  ) : item.type.startsWith('video/') ? (
                    <video src={item.url} controls className="max-w-full max-h-full" />
                  ) : item.type.startsWith('audio/') ? (
                    <audio src={item.url} controls className="max-w-full" />
                  ) : (
                    <div>Unsupported media type</div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="absolute top-0 left-0 z-10 w-full h-[100px] bg-gradient-to-b from-black/50 to-transparent">
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={closeGallery}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </MediaGalleryContext.Provider>
  );
};

export const useMediaGallery = () => {
  const context = useContext(MediaGalleryContext);
  if (context === undefined) {
    throw new Error('useMediaGallery must be used within a MediaGalleryProvider');
  }
  return context;
};

interface MessageProps {
  message: {
    id: string;
    content: string;
    media?: { url: string; type: string; name: string; size?: number }[];
    createdAt: string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    isSystemMessage?: boolean;
    isRead?: boolean;
  };
  isCurrentUser: boolean;
  showUserName: boolean;
  showAvatar: boolean;
  isGrouped: boolean;
}

const SystemMessage = ({ message }: { message: MessageProps['message'] }) => (
  <div className="flex justify-center my-2">
    <span className="bg-gray-500/80 text-white rounded-full px-3 py-1 text-sm max-w-full">
      {message.content}
    </span>
  </div>
);

export const UserAvatar = ({ src, name, onClick }: { src: string | null, name: string | null, onClick: () => void }) => (
  <Avatar 
    src={src || ""} 
    alt={name || 'User'} 
    className="sm:mr-1 mr-2 cursor-pointer self-end sticky bottom-0 min-w-8 w-8 h-8"
    size="sm"
    onClick={onClick}
  />
);

const MediaRenderer = ({ mediaItem, onClick }: { mediaItem: { url: string; type: string; name: string; size?: number, width?: number, height?: number }, onClick: () => void }) => {
  const aspectRatio = (mediaItem.width && mediaItem.height) ? mediaItem.width / mediaItem.height : 1;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (mediaItem.type.startsWith('image/')) {
    return (
      <div style={{width: `min(100%, min(calc(70vh * ${aspectRatio}), ${mediaItem.width || 100}px))`}} className='h-100 relative '>
        <div className="rounded overflow-hidden flex justify-between flex-col">
          <div>
            <div className='rounded overflow-hidden' style={{ maxHeight: '70vh', aspectRatio }}>
              <div className='w-full h-full'>
                <img 
                  src={mediaItem.url} 
                  alt={mediaItem.name}  
                  className="h-full w-full block max-w-full hover:cursor-pointer"
                  onClick={onClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (mediaItem.type.startsWith('video/')) {
    return (
      <div className="relative rounded overflow-hidden">
        <div 
          className="absolute z-[1] top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <FaPlay className="text-white text-4xl" />
        </div>
        <video 
          className="max-w-full " 
          style={{ aspectRatio: `${mediaItem.width || 16}/${mediaItem.height || 9}` }}
        >
          <source src={mediaItem.url} type={mediaItem.type} />
        </video>
      </div>
    );
  } else if (mediaItem.type.startsWith('audio/')) {
    return (
      <div className="flex items-center  rounded-full p-2">
        <button onClick={togglePlay} className="mr-2">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <audio ref={audioRef} src={mediaItem.url} onEnded={() => setIsPlaying(false)} />
        <div className="text-sm">{mediaItem.name}</div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center">
        <FaFile className="mr-2" />
        <div className="mr-2 text-sm">
          <div className="max-w-[200px]  text-ellipsis whitespace-pre-wrap break-all">{mediaItem.name}</div>
          <div className="text-xs">
            {mediaItem.size && `(${bytes(mediaItem.size)})`}
          </div>
        </div>
        <Button
          size="sm"
          className='ml-auto'
          onClick={() => window.open(mediaItem.url, '_blank')}
          isIconOnly={true}
          startContent={<FaDownload />}
        />
      </div>
    );
  }
};

const MediaGallery = ({ media }: { media: MessageProps['message']['media'] }) => {
  const { openGallery } = useMediaGallery();

  if (!media || media.length === 0) return null;

  const handleMediaClick = (index: number) => {
    openGallery(media, index);
  };

  return (
    <div className="flex flex-wrap gap-2 ">
      {media.map((item, index) => (
        <MediaRenderer key={index} mediaItem={item} onClick={() => handleMediaClick(index)} />
      ))}
    </div>
  );
};

const wrapUrlsWithTags = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => 
    urlRegex.test(part) ? (
      <a key={index} href={part} target="_blank" rel="noopener noreferrer" className=" hover:underline">
        {part}
      </a>
    ) : (
      part
    )
  );
};

const MessageContent = ({ content, userName, showUserName }: { content: string, userName: string | null, showUserName: boolean }) => (
  <>
    {showUserName && (
      <div className="font-bold text-sm break-words break-all flex-grow w-full">{userName}</div>
    )}
    {content && (
      <div className="max-w-full break-words whitespace-pre-wrap leading-[1.3rem]"> 
        {wrapUrlsWithTags(content)}
      </div>
    )}
  </>
);

const MessageFooter = ({ createdAt, isCurrentUser, isRead }: { createdAt: string | null, isCurrentUser: boolean, isRead?: boolean }) => (
  <div className={`flex ml-auto self-end items-center text-xs mt-1 ${isCurrentUser ? 'text-blue-200 justify-end' : 'text-left text-gray-500'}`}>
    <p className="ml-1">{formatTime(createdAt)}</p>
    {isCurrentUser && (
      <span className="ml-1">
        {isRead ? <TbChecks color='#90EE90' size={15}/> : <FaCheck />}
      </span>
    )}
  </div>
);

import { Popover, ModalHeader, ModalBody } from "@nextui-org/react";
import { deleteMessage } from '@/lib/actions';
import { useLoading } from "@/lib/hooks";

function DeleteMessageModal({ message }: { message: MessageProps['message'] }) {
  const {isLoading, call} = useLoading(async () => {
    await deleteMessage(message.id)
    window.closeModal('DeleteMessageModal')
    if (typeof (window as any).deleteMessage === 'function') {
      (window as any).deleteMessage(message.id)
    }
  })
  return (
    <ModalContent>
      <ModalHeader>Are you sure?</ModalHeader>
      <ModalBody>
        <Button isLoading={isLoading} onPress={call} color='danger'>Delete</Button>
      </ModalBody>
    </ModalContent>
  )
}

import { useSmallScreen } from '@/lib/hooks'
import { AnimatePresence, motion } from 'framer-motion';

export default function Message({ message, isCurrentUser, showUserName, showAvatar, isGrouped }: MessageProps) {
  if (message.isSystemMessage) {
    return <SystemMessage message={message} />;
  }
  const maxWidth = message.media && message.media?.length > 0 ? 300 : null;
  const maxHeight = message.media && message.media?.length > 0 ? 300 : null;
  const isSmallScreen = useSmallScreen()

  const style = maxWidth && maxHeight ? {
    maxWidth: `calc(min(${isSmallScreen ? '90%' : '70%'}, calc(${maxWidth / maxHeight} * min(70vh, ${maxHeight}px))))`,
    flexGrow: 1,
  } : {maxWidth: isSmallScreen ? '90%' : '70%'};

  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0, placement: 'right' });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleMessageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if ((event.target as HTMLElement).closest('.media-item')) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Always place on the left
    const placement = 'left';
    
    setPopoverPosition({ x, y, placement });
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isPopoverOpen && !(event.target as Element).closest('.message-popover')) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isPopoverOpen]);

  const messageActions = [
    { label: 'Reply', action: () => console.log('Reply to message'), icon: <FaReply /> },
    { label: 'Copy', action: () => {
      if (message.content) {
        navigator.clipboard.writeText(message.content);
      }
    }, icon: <FaCopy /> },
  ];
  if (isCurrentUser) {
    messageActions.push({ label: 'Delete', action: () => window.openModal('DeleteMessageModal', <DeleteMessageModal message={message} />), icon: <FaTrash /> });
  }

  return (
    <MediaGalleryProvider>
      <div className="relative">
        <div 
        onClick={handleMessageClick}
        className={`flex animate-fade-in items-start ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : ''}`}
      >
        <div className={twMerge(
          'flex p-1 rounded-md flex-wrap',
          message.media && message.media?.length > 0 ? 'flex-col' : 'flex-row',
          (isCurrentUser ? 'bg-blue-500 text-white ' : 'bg-gray-200'),
          !message.media || message.media?.length === 0 ? (isCurrentUser ? 'rounded-l-[18px] pl-3' : 'rounded-r-[18px]  pl-2 pr-3') : ''
        )} style={style}>
          <MessageContent
            content={message.content}
            userName={message.user.name}
            showUserName={!isCurrentUser && showUserName}
          />
          <MediaGallery media={message.media} />
          <MessageFooter
            createdAt={message.createdAt}
            isCurrentUser={isCurrentUser}
            isRead={message.isRead}
          />
        </div>
      </div>
      <AnimatePresence>
        {isPopoverOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 bg-white shadow-lg rounded-lg p-2 message-popover"
            style={{ 
              left: `${popoverPosition.x}px`, 
              top: `${popoverPosition.y}px` 
            }}
          >
            {messageActions.map((action, index) => (
              <Button 
                size="sm" 
                key={index} 
                onPress={() => { 
                  action.action(); 
                  handlePopoverClose(); 
                }} 
                className={`${index !== messageActions.length - 1 ? 'mb-1' : ''} w-full rounded-lg flex items-center justify-start`}
              >
                <span className="mr-2">{action.icon}</span>
                {action.label}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </MediaGalleryProvider>
  );
}