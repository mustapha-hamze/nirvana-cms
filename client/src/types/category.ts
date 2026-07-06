import type { LangKey } from './content'

export type CategoryStatus = 'active' | 'inactive'

export type CategoryTranslation = {
  langKey: LangKey
  title: string
  slug: string
}

export type Category = {
  _id: string
  application: string
  translations: CategoryTranslation[]
  parentId: string | null
  status: CategoryStatus
  publicId: string
  createdAt: string
  updatedAt: string
}
