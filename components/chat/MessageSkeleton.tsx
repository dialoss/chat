import { Skeleton } from "@nextui-org/react"

export default function MessageSkeleton({ side = 'left' }: { side?: 'left' | 'right' }) {
  return (
    <div className={`flex items-start mt-4 ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
      {side === 'left' && <Skeleton className="rounded-full h-8 w-8 mr-2" />} {/* Avatar */}
      <div className={`max-w-[70%] flex p-1 rounded-md flex-col ${side === 'right' ? 'bg-blue-200/40 rounded-l-[18px] pl-3 pr-2' : 'bg-gray-200/40 rounded-r-[18px] pr-3 pl-2'}`}>
        <Skeleton className="h-4 w-20 mb-2 rounded" /> {/* User name */}
        <Skeleton className="h-4 w-48 mb-2 rounded" /> {/* Message content */}
        <div className="flex justify-end">
          <Skeleton className="h-3 w-12 rounded" /> {/* Timestamp */}
        </div>
      </div>
    </div>
  )
}