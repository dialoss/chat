import { useState, useEffect } from "react"

export function useLoading(func: () => Promise<void>) {
    const [isLoading, setIsLoading] = useState(false)
    async function call(...args: any[]) {
      setIsLoading(true)
      await func(...args)
      setIsLoading(false)
    }
    return { isLoading, call }
  }
  

  
export function useSmallScreen() {
    const [isSmallScreen, setIsSmallScreen] = useState(false)
    useEffect(() => {
      const handleResize = () => {
        setIsSmallScreen(window.innerWidth < 800)
      }
  
      handleResize()
      window.addEventListener('resize', handleResize)
  
      return () => window.removeEventListener('resize', handleResize)
    }, [])
  
    return isSmallScreen
  }