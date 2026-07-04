import bcrypt from 'bcryptjs'

export function passwordHashPlugin(schema) {
  schema.pre('save', async function hashPassword() {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 10)
  })

  schema.methods.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password)
  }
}
