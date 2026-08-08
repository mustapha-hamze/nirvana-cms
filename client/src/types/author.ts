import type { LangKey } from './content'

export type AuthorStatus = 'active' | 'inactive'

export type AuthorTranslation = {
  langKey: LangKey
  bio: string
}

export type AuthorSocialLinks = {
  linkedin: string
  x: string
  instagram: string
}

export type Author = {
  _id: string
  application: string
  firstName: string
  lastName: string
  displayName: string
  slug: string
  email: string
  jobTitle: string
  websiteUrl: string
  avatar: string
  socialLinks: AuthorSocialLinks
  translations: AuthorTranslation[]
  status: AuthorStatus
  publicId: string
  createdAt: string
  updatedAt: string
}
