/**
 * Mongoose plugin that implements soft delete.
 *
 * - Adds `isDeleted: Boolean, default: false` to the schema.
 * - Injects `{ isDeleted: { $ne: true } }` into every find/count query
 *   so deleted records are invisible by default.
 * - Using $ne: true instead of === false keeps existing documents
 *   that don't yet have the field visible during migrations.
 *
 * To intentionally query deleted records, pass `isDeleted: true`
 * (or any explicit value) in the filter — the hook skips injection
 * when the caller already specifies the field.
 */
import mongoose from 'mongoose'

const SOFT_DELETE_METHODS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'countDocuments',
]

export function softDeletePlugin(schema: mongoose.Schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
  })

  schema.pre(SOFT_DELETE_METHODS as any, function (this: any) {
    if (this._conditions.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } })
    }
  })
}
