// Response envelope shared by the paginated list endpoints (Contents, Tags,
// Pages) — mirrors server/src/utils/paginateList.js's return shape exactly.
export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
