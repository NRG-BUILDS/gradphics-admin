import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"

type RequestState<T> = {
  data: T
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useRequest<T>(path: string, fallback: T): RequestState<T> {
  const [data, setData] = useState(fallback)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!path) {
      setData(fallback)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setData(await apiRequest<T>(path))
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Request failed",
      )
    } finally {
      setIsLoading(false)
    }
  }, [path])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, isLoading, error, refetch }
}
