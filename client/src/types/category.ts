export type CategoryStatus = 'active' | 'inactive'

export type Category = {
  _id: string
  application: string
  title: string
  parentId: string | null
  status: CategoryStatus
  createdAt: string
  updatedAt: string
}
