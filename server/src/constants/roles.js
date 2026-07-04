export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SuperAdmin',
  WEBSITE_ADMIN: 'WebSiteAdmin',
  CONTENT_CREATOR: 'WebSiteContentCreator',
  WEBSITE_USER: 'WebsiteUser',
})

export const ROLE_VALUES = Object.values(ROLES)

// Roles that must have an application assigned
export const APP_SCOPED_ROLES = [ROLES.WEBSITE_ADMIN, ROLES.CONTENT_CREATOR, ROLES.WEBSITE_USER]
