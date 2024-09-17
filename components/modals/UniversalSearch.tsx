import React, { useState, useEffect, useMemo } from 'react'
import { Input, Button } from "@nextui-org/react"
import { FaSearch } from 'react-icons/fa'
import debounce from 'lodash/debounce'
import RoomInfoModal from './RoomInfoModal';
import { callApi } from "@/app/utils/api"
interface UniversalSearchProps<T> {
  apiPath: string
  placeholder: string
  onSelect: (item: T) => void
  renderItem: (item: T) => React.ReactNode
  showSearch?: boolean
}

function UniversalSearch<T>({ apiPath, placeholder, showSearch=true, onSelect, renderItem }: UniversalSearchProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string, pageNum: number) => {
        if (query.trim() === '') {
          setResults([])
          setHasMore(false)
          return
        }

        setIsLoading(true)
        try {
          const url = new URL(window.location.origin + apiPath);
          const params = url.searchParams;
          params.set('query', query)
          params.set('page', pageNum.toString())
          const data = await callApi(`${url.origin}${url.pathname}?${params.toString()}`)
          setResults(data.items)
          setHasMore(data.hasMore)
     
        } catch (error) {
          console.error('Error searching:', error)
        } finally {
          setIsLoading(false)
        }
      }, 300),
    [apiPath]
  )

  useEffect(() => {
    setPage(1)
    debouncedSearch(searchQuery, 1)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  useEffect(() => {
    if (!showSearch) {
      setSearchQuery('.')
    }
  }, [showSearch])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    debouncedSearch(searchQuery, nextPage)
  }
  const LoadingIndicator = () => (
    <div className="flex justify-center items-center py-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
    </div>
  )

  return (
    <div>
      {showSearch && <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearchChange}
        startContent={<FaSearch className="text-gray-400" />}
      />}
      {!isLoading && searchQuery && <div className="max-h-72 overflow-y-auto py-2">
        {results.length > 0 ? (
          results.map((item, index) => (
            <div
              key={index}
              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => onSelect(item)}
            >
              {renderItem(item)}
            </div>
          ))
        ) : (
          <p>No results found matching "{searchQuery}"</p>
        )}
      </div>}
      {isLoading && <LoadingIndicator />}
      {hasMore && (
        <Button onClick={loadMore} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  )
}

export default UniversalSearch