import type { LangKey } from './content'

export type TagStatus = 'active' | 'inactive'

export type TagTranslation = {
  langKey: LangKey
  title: string
  slug: string
}

export type Tag = {
  _id: string
  application: string
  translations: TagTranslation[]
  status: TagStatus
  publicId: string
  createdAt: string
  updatedAt: string
}
