export type TagStatus = 'active' | 'inactive'

export type Tag = {
  _id: string
  application: string
  title: string
  status: TagStatus
  publicId: string
  createdAt: string
  updatedAt: string
}
