import mongoose from 'mongoose'
import { ROLE_VALUES, APP_SCOPED_ROLES, ROLES } from '../constants/roles.js'
import { passwordHashPlugin } from '../utils/passwordHashPlugin.js'
import { softDeletePlugin } from '../utils/softDeletePlugin.js'

const userSchema = new mongoose.Schema(
  {
    // Staff: plain email. WebsiteUser: "[applicationId]-[email]" for tenant uniqueness.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLE_VALUES, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    // SuperAdmin → empty array. All other roles → at least one application.
    // WebsiteUser → exactly one application (email key is scoped to it).
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  },
  { timestamps: true },
)

userSchema.pre('validate', function enforceApplicationRule() {
  if (!APP_SCOPED_ROLES.includes(this.role)) return

  if (!this.applications || this.applications.length === 0) {
    this.invalidate('applications', 'at least one application is required for this role')
  }

  if (this.role === ROLES.WEBSITE_USER && this.applications.length > 1) {
    this.invalidate('applications', 'WebsiteUser can only belong to one application')
  }
})

userSchema.plugin(passwordHashPlugin)
userSchema.plugin(softDeletePlugin)

export default mongoose.model('User', userSchema)
