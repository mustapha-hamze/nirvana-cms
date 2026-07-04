import User from '../models/User.js'
import Application from '../models/application/Application.js'
import { ROLES, APP_SCOPED_ROLES } from '../constants/roles.js'

// For WebsiteUser the stored email is "[applicationId]-[realEmail]".
function buildEmail(role, applications, email) {
  if (role === ROLES.WEBSITE_USER) return `${applications[0]}-${email}`
  return email
}

function parseDisplayEmail(user) {
  if (user.role !== ROLES.WEBSITE_USER) return user.email
  return user.email.replace(/^[a-f0-9]{24}-/, '')
}

function formatUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user }
  delete obj.password
  obj.displayEmail = parseDisplayEmail(obj)
  return obj
}

async function validateApplicationIds(ids) {
  const found = await Application.countDocuments({ _id: { $in: ids } })
  return found === ids.length
}

export async function getUsers(req, res) {
  const { application, role } = req.query
  const filter = {}
  // MongoDB matches if the applications array contains this value
  if (application) filter.applications = application
  if (role) filter.role = role

  const users = await User.find(filter)
    .populate('applications', 'name')
    .sort({ createdAt: -1 })
  res.json(users.map(formatUser))
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id).populate('applications', 'name')
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(formatUser(user))
}

export async function createUser(req, res) {
  const { name, email, password, role, applications } = req.body

  if (!name) return res.status(400).json({ message: 'name is required' })
  if (!email) return res.status(400).json({ message: 'email is required' })
  if (!password) return res.status(400).json({ message: 'password is required' })
  if (!role) return res.status(400).json({ message: 'role is required' })

  const appIds = Array.isArray(applications) ? applications : applications ? [applications] : []

  if (APP_SCOPED_ROLES.includes(role) && appIds.length === 0) {
    return res.status(400).json({ message: 'at least one application is required for this role' })
  }

  if (role === ROLES.WEBSITE_USER && appIds.length !== 1) {
    return res.status(400).json({ message: 'WebsiteUser must belong to exactly one application' })
  }

  if (appIds.length > 0 && !(await validateApplicationIds(appIds))) {
    return res.status(400).json({ message: 'One or more applications not found' })
  }

  const storedEmail = buildEmail(role, appIds, email.toLowerCase().trim())

  try {
    const user = await User.create({ email: storedEmail, password, name, role, applications: appIds })
    await user.populate('applications', 'name')
    res.status(201).json(formatUser(user))
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists' })
    }
    throw err
  }
}

export async function updateUser(req, res) {
  const { name, password, role } = req.body

  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  // findByIdAndUpdate bypasses the pre('save') password-hashing hook, so
  // fields are assigned and saved through the document to keep hashing intact.
  if (name !== undefined) user.name = name
  if (password !== undefined) user.password = password
  if (role !== undefined) user.role = role

  try {
    await user.save()
    await user.populate('applications', 'name')
    res.json(formatUser(user))
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A user with this email already exists' })
    }
    throw err
  }
}

export async function updateUserStatus(req, res) {
  const { status } = req.body
  const allowedStatuses = User.schema.path('status').enumValues

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowedStatuses.join(', ')}` })
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  ).populate('applications', 'name')

  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(formatUser(user))
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true })
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.status(204).send()
}

export async function assignApplication(req, res) {
  const { applicationId } = req.body

  if (!applicationId) return res.status(400).json({ message: 'applicationId is required' })

  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  if (user.role === ROLES.SUPER_ADMIN) {
    return res.status(400).json({ message: 'SuperAdmin cannot be assigned to an application' })
  }

  if (user.role === ROLES.WEBSITE_USER) {
    return res.status(400).json({ message: 'WebsiteUser already has an application; create a new user for a different app' })
  }

  if (!(await Application.exists({ _id: applicationId }))) {
    return res.status(404).json({ message: 'Application not found' })
  }

  await User.updateOne({ _id: user._id }, { $addToSet: { applications: applicationId } })

  const updated = await User.findById(user._id).populate('applications', 'name')
  res.json(formatUser(updated))
}

export async function unassignApplication(req, res) {
  const { appId } = req.params

  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  if (user.applications.length <= 1 && APP_SCOPED_ROLES.includes(user.role)) {
    return res.status(400).json({ message: 'User must remain assigned to at least one application' })
  }

  await User.updateOne({ _id: user._id }, { $pull: { applications: appId } })

  const updated = await User.findById(user._id).populate('applications', 'name')
  res.json(formatUser(updated))
}
