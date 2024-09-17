import { useRef, useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import Message from './Message'  // Changed to default import
import MessageSkeleton from './MessageSkeleton'
import { useBackgroundImage } from './useBackgroundImage'
import { formatTime } from '../../utils/dateFormat'
import UserProfileModal from '../modals/UserProfileModal'
import { UserAvatar } from './Message'
import { useSession } from 'next-auth/react'
import { formatDate } from '../../utils/dateFormat'
import { twMerge } from 'tailwind-merge'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  loadMoreMessages: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  page: number
  unreadCount: number
  renderMessage: (message: Message, isCurrentUser: boolean, showUserName: boolean, showAvatar: boolean, isGrouped: boolean) => React.ReactNode
  readMessages: (messageIds: string[]) => void
}

const sort = (a, b) => formatTime(a.createdAt, true).getTime() - formatTime(b.createdAt, true).getTime()

export default function MessageList({ readMessages, isLoading, messages, currentUserId, loadMoreMessages, hasMore, page, unreadCount, renderMessage }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevScroll = useRef(0);
  const prevPage = useRef(page);

  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set())

  const onMessageVisible = useCallback((messageId: string, isVisible: boolean) => {
    setVisibleMessages(prev => {
      const newSet = new Set(prev)
      if (isVisible) {
        newSet.add(messageId)
      } else {
        newSet.delete(messageId)
      }
      return newSet
    })
  }, [])

  useEffect(() => {
    const unreadMessages = Array
      .from(visibleMessages)
      .map(id => messages.find(m => m.id === id))
      .filter(Boolean)
      .filter(m => m.user.id !== currentUserId)
      .sort(sort)
      .reverse()
      .slice(0, unreadCount)
    if (unreadMessages.length > 0) {
      readMessages(unreadMessages.map(m => m.id))
    }
  }, [visibleMessages, unreadCount])

  function handleScroll() {
    const cont = scrollContainerRef.current
    if (cont) {
      prevScroll.current = cont.scrollTop
      if (!isLoading && hasMore && cont.offsetHeight - cont.scrollTop >= cont.scrollHeight - 10) {
        loadMoreMessages();
        prevPage.current = page;
      }
    }
  }

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTop = prevScroll.current
    }
  }, [messages])

  const groupedMessages = messages
    .sort(sort)
    .reduce((acc, message, index) => {
      if (index === 0 || message.user.id !== messages[index - 1].user.id || (message.isSystemMessage !== messages[index - 1].isSystemMessage)) {
        acc.push([message]);
      } else {
        acc[acc.length - 1].push(message);
      }
      return acc;
    }, [] as Message[][])

    const groupedMessagesByDate = groupedMessages.reduce((acc, group) => {
    const date = formatDate(group[0].createdAt, "MMM d");

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(group);
    return acc;
  }, {} as Record<string, Message[][]>);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScrollWithTimeMessage = () => {
    handleScroll();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // console.log(messages, groupedMessages)

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScrollWithTimeMessage}
      className="flex overflow-y-auto overscroll-none overflow-x-hidden gap-4 sm:p-1 p-4 flex-col-reverse h-full max-h-full bg-opacity-60 custom-scrollbar sm:text-sm"
    >
      {isLoading && page === 1 &&
        <div className="flex flex-col justify-end h-full">
          {[...Array(5)].map((_, index) => (
            <MessageSkeleton key={index} side={`${index % 2 === 0 ? 'left' : 'right'}`} />
          ))}
        </div>
      }
      {Object.entries(groupedMessagesByDate).reverse().map(([date, groups], dateIndex) => (
        <div key={date} className="flex flex-col gap-3">
          <div className={`sticky time-message top-0 z-10 flex justify-center my-2 transition-opacity duration-300 ${'opacity-100'}`}>
            <span className="bg-black/35 text-white rounded-full px-3 py-1 text-sm">
              {date}
            </span>
          </div>
          {groups.map((group: Message[]) => {
            const message = group[0];
            const isCurrentUser = message.user.id === currentUserId;

            const handleAvatarClick = async () => {
              window.openModal('userProfile', <UserProfileModal userId={message.user.id} />);    
            };

            return (
              <div key={group[0].id + "group"} className={twMerge("flex", message.float && "sticky top-0")}>
                {!isCurrentUser && !message.isSystemMessage && (
                  <UserAvatar
                    src={message.user.image}
                    name={message.user.name}
                    onClick={handleAvatarClick}
                  />
                )}
                <div className={`w-full ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  {group.map((message: Message, messageIndex: number) => (
                    unreadCount > 0 ? 
                    <MessageWrapper
                      key={message.id}
                      message={message}
                      onMessageVisible={onMessageVisible}
                      renderMessage={() => renderMessage(
                        message,
                        isCurrentUser,
                        messageIndex === 0,
                        messageIndex === group.length - 1,
                        messageIndex > 0
                      )}
                    /> : 
                    <div key={message.id} id={message.id}>
                      {renderMessage(
                        message, 
                        isCurrentUser, 
                        messageIndex === 0, 
                        messageIndex === group.length - 1, 
                        messageIndex > 0
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {hasMore && page > 1 &&
        <div className="flex justify-center items-center h-8 w-full max-h-16">
          <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="loader"></div>
          </div>
        </div>
      }
    </div>
  )
}

interface MessageWrapperProps {
  message: Message
  onMessageVisible: (messageId: string, isVisible: boolean) => void
  renderMessage: () => React.ReactNode
}

function MessageWrapper({ message, onMessageVisible, renderMessage }: MessageWrapperProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  useEffect(() => {
    onMessageVisible(message.id, inView)
  }, [message.id, inView, onMessageVisible])

  return (
    <div ref={ref} id={message.id}>
      {renderMessage()}
    </div>
  )
}
