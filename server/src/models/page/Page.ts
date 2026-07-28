import mongoose from 'mongoose'
import { softDeletePlugin } from '../../utils/softDeletePlugin.js'

export interface PageDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  isHomepage: boolean;
  isDeleted: boolean;
}

// Shared across every language translation of this page — same split as
// Content/ContentDetails. `isHomepage` identifies "the page that renders at
// the site root" and, like categories/tags on Content, belongs here rather
// than on PageDetails: a page's identity/role doesn't change per language,
// only its title/slug/sections do.
const pageSchema = new mongoose.Schema<PageDoc>(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    isHomepage: { type: Boolean, default: false },
  },
  { timestamps: true },
)

// Partial unique index: at most one homepage per application, but any number
// of non-homepage pages (a unique index on `isHomepage: true` alone would
// otherwise also forbid a second `false` row).
pageSchema.index(
  { application: 1, isHomepage: 1 },
  { unique: true, partialFilterExpression: { isHomepage: true } },
)

pageSchema.plugin(softDeletePlugin)

export default mongoose.model<PageDoc>('Page', pageSchema)
