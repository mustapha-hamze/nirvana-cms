import type { LangKey } from './content'

export type MenuStatus = 'active' | 'inactive'
export type MenuItemAvailability = 'available' | 'unavailable' | 'sold_out'

export type MenuSettings = {
  showCalories: boolean
  showImages: boolean
  showUnavailableItems: boolean
}

export type Menu = {
  _id: string
  application: string
  publicId: string
  slug: string
  status: MenuStatus
  currency: string
  settings: MenuSettings
  createdAt: string
  updatedAt: string
}

export type MenuCategoryTranslation = {
  langKey: LangKey
  title: string
  description: string
  slug: string
}

export type MenuCategory = {
  _id: string
  application: string
  menu: string
  publicId: string
  image: string
  status: MenuStatus
  sortOrder: number
  translations: MenuCategoryTranslation[]
  createdAt: string
  updatedAt: string
}

export type MenuItemTranslation = {
  langKey: LangKey
  title: string
  description: string
  slug?: string
}

export type MenuItem = {
  _id: string
  application: string
  menu: string
  category: string
  publicId: string
  image: string
  price: number
  calories?: number
  status: MenuStatus
  availability: MenuItemAvailability
  sortOrder: number
  translations: MenuItemTranslation[]
  ingredients: string[]
  allergens: string[]
  isVegetarian: boolean
  isVegan: boolean
  isSpicy: boolean
  spicyLevel: number
  createdAt: string
  updatedAt: string
}
