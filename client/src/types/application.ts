import type { LangKey } from './content'

export type ApplicationStatus = 'active' | 'inactive'

export type Application = {
  _id: string
  name: string
  description: string
  logo: string | null
  status: ApplicationStatus
  createdAt: string
  languages?: LangKey[]
}
