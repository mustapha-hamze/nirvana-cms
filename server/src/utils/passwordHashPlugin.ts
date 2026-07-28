import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

export function passwordHashPlugin(schema: mongoose.Schema) {
  schema.pre('save', async function hashPassword(this: any) {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 10)
  })

  schema.methods.comparePassword = function comparePassword(this: any, candidate: string) {
    return bcrypt.compare(candidate, this.password)
  }
}
