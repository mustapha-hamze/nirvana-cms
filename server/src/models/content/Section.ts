import mongoose from 'mongoose'
import { SECTION_TYPE_VALUES } from '../../constants/sectionTypes.js'
import { elementBaseSchema, attachElementDiscriminators } from './Elements.js'

// A section is deliberately NOT itself a discriminated type — every layout is
// structurally identical at the persistence layer (an ordered `elements`
// array); what differs between layouts is a business rule (which element
// types/counts are allowed, see constants/sectionTypes.js SECTION_LAYOUTS),
// which is validated in the controller rather than encoded as separate
// Mongoose schemas. If a future layout needs genuinely different *fields*
// (not just a different element composition) — e.g. a "hero" section with its
// own heading/backgroundColor fields — that's the trigger to give sections
// their own discriminators via
// `contentDetailsSchema.path('sections').discriminator(type, schema)`,
// following the same `.path(arrayField).discriminator(key, schema)` pattern
// used below for elements.
export const sectionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: SECTION_TYPE_VALUES, required: true },
    elements: {
      type: [elementBaseSchema],
      validate: {
        validator: (arr: unknown[]) => Array.isArray(arr) && arr.length >= 1 && arr.length <= 3,
        message: 'A section must have between 1 and 3 elements',
      },
    },
  },
  { _id: true, timestamps: false },
)

attachElementDiscriminators(sectionSchema.path('elements') as mongoose.Schema.Types.DocumentArray)
