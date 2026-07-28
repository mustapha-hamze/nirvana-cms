import mongoose from "mongoose";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

export interface TagTranslation {
  langKey: string;
  title: string;
  slug: string;
}

export interface TagDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  publicId: string;
  translations: mongoose.Types.DocumentArray<TagTranslation>;
  // Runtime-validated against the schema's own enumValues, not a compile-time
  // literal — see Category.ts's CategoryDoc.status for the same rationale.
  status: string;
  isDeleted: boolean;
}

// Same reasoning as Category.translations — one tag, one label per language,
// no per-language publish lifecycle so an embedded array is enough.
const translationSchema = new mongoose.Schema(
  {
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    title: { type: String, required: true, trim: true },
    // Auto-derived from title (see tagController) — never client-supplied.
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const tagSchema = new mongoose.Schema<TagDoc>(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    // Short, random, non-sequential id — safe to expose in public frontend URLs
    // instead of the Mongo _id (which would otherwise leak insertion order/timestamp
    // and, if ever made sequential, would be trivially enumerable).
    publicId: { type: String, required: true, unique: true },
    translations: {
      type: [translationSchema],
      validate: {
        validator: (arr: unknown[]) => arr.length > 0,
        message: "At least one language translation is required",
      },
    },
    // Unlike Category, tags are flat — no parent/child hierarchy.
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

tagSchema.index({ application: 1 });
// Multikey index: enforces one slug per (application, language) across every
// tag's translations array, so two tags can't collide in the same language's
// URL space.
tagSchema.index(
  { application: 1, "translations.langKey": 1, "translations.slug": 1 },
  { unique: true },
);

tagSchema.plugin(softDeletePlugin);

export default mongoose.model<TagDoc>("Tag", tagSchema);
