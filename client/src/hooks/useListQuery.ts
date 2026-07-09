import { useState, useEffect } from 'react'
import type { SortDirection } from '../components/ui/SortableHeader'

export type ListSortBy = 'title' | 'createdAt'

// Shared search/sort/page state for admin list pages backed by the
// paginateList-style API (Contents, Tags, Pages) — debounces the search
// input so typing doesn't fire a request per keystroke, and resets back to
// page 1 whenever the search term or sort changes, since a page number from
// the previous result set may no longer exist in the new one.
export function useListQuery(defaultSortBy: ListSortBy = 'createdAt') {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<ListSortBy>(defaultSortBy)
  const [sortOrder, setSortOrder] = useState<SortDirection>(defaultSortBy === 'title' ? 'asc' : 'desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, sortBy, sortOrder])

  function toggleSort(column: ListSortBy) {
    if (sortBy === column) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder(column === 'title' ? 'asc' : 'desc')
    }
  }

  return { searchInput, setSearchInput, search, sortBy, sortOrder, page, setPage, toggleSort }
}
