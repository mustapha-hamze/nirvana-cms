import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { PaginatedResult } from '../types/pagination'
import { useListQuery, type ListSortBy } from './useListQuery'

const EMPTY_RESULT = <T,>(): PaginatedResult<T> => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 1 })

// Wraps useListQuery's search/sort/page state with the fetch lifecycle every
// paginated admin list (Contents, Tags, Pages) repeats: build the query
// string, GET it whenever any query param or the target application changes,
// and expose a `refresh` for callers that mutate then need to refetch (e.g.
// after a delete).
export function usePaginatedApiList<T>({
  endpoint,
  applicationId,
  defaultSortBy,
}: {
  endpoint: string
  applicationId: string | undefined
  defaultSortBy?: ListSortBy
}) {
  const [result, setResult] = useState<PaginatedResult<T>>(EMPTY_RESULT<T>())
  const [loading, setLoading] = useState(true)
  const query = useListQuery(defaultSortBy)
  const { search, sortBy, sortOrder, page } = query

  const refresh = useCallback(async () => {
    if (!applicationId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ application: applicationId, sortBy, sortOrder, page: String(page) })
      if (search) params.set('search', search)
      const data = await api.get<PaginatedResult<T>>(`${endpoint}?${params}`)
      setResult(data)
    } finally {
      setLoading(false)
    }
  }, [endpoint, applicationId, search, sortBy, sortOrder, page])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...query, result, loading, refresh }
}
