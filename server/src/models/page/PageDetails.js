import mongoose from 'mongoose'
import { LANGUAGE_VALUES } from '../../constants/languages.js'
import { softDeletePlugin } from '../../utils/softDeletePlugin.js'
import { pageSectionSchema } from './Section.js'

const pageDetailsSchema = new mongoose.Schema(
  {
    page: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
    },
    // Denormalized from Page so slug uniqueness can be enforced per-application
    // with a single compound index, without a join back to Page on every write
    // — same reasoning as ContentDetails.application.
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    // Doubles as the admin-facing label (list rows, breadcrumbs) and the
    // default browser/H1 title — there's no separate headline/abstract like
    // Content has, because a page's actual visual content is entirely its
    // `sections` (a hero slide already carries its own heading/subheading).
    title: { type: String, required: true, trim: true },
    // Public, URL-friendly identifier for this language's page — unused for
    // the page flagged `isHomepage` (that one renders at the site root), but
    // still generated/stored for consistency and in case it stops being the
    // homepage later.
    slug: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null },
    metadata: {
      keywords: { type: [{ type: String, trim: true }], default: [] },
      author: { type: String, trim: true, default: '' },
      description: { type: String, trim: true, default: '' },
    },
    // Ordered page body — array position IS the display order, same
    // convention as ContentDetails.sections.
    sections: {
      type: [pageSectionSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 40,
        message: 'A page may have at most 40 sections',
      },
    },
  },
  { timestamps: true },
)

pageDetailsSchema.index({ page: 1, langKey: 1 }, { unique: true })
pageDetailsSchema.index({ application: 1, langKey: 1, slug: 1 }, { unique: true })

// Track the most recent time this language went live; preserved across later unpublishes.
pageDetailsSchema.pre('save', function stampPublishedAt() {
  if (this.isModified('status') && this.status === 'published') {
    this.publishedAt = new Date()
  }
})

pageDetailsSchema.plugin(softDeletePlugin)

export default mongoose.model('PageDetails', pageDetailsSchema)
