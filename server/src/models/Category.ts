import mongoose from "mongoose";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

export interface CategoryTranslation {
  langKey: string;
  title: string;
  slug: string;
}

export interface CategoryDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  publicId: string;
  translations: mongoose.Types.DocumentArray<CategoryTranslation>;
  parentId: mongoose.Types.ObjectId | null;
  // Runtime-validated against the schema's own enumValues (see
  // categoryController's STATUS_VALUES), not a compile-time literal — kept as
  // `string` so a validated-at-runtime value can be assigned without a cast.
  status: string;
  isDeleted: boolean;
}

// One category can hold a different title per language (the same bucket of
// content, just labeled differently) — unlike Content, there's no per-language
// publish status/body here, so this is an embedded array rather than a
// separate collection.
const translationSchema = new mongoose.Schema(
  {
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    title: { type: String, required: true, trim: true },
    // Auto-derived from title (see categoryController) — never client-supplied.
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema<CategoryDoc>(
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
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

categorySchema.index({ application: 1, parentId: 1 });
// Multikey index: enforces one slug per (application, language) across every
// category's translations array, so two categories can't collide in the same
// language's URL space.
categorySchema.index(
  { application: 1, "translations.langKey": 1, "translations.slug": 1 },
  { unique: true },
);

categorySchema.plugin(softDeletePlugin);

export default mongoose.model<CategoryDoc>("Category", categorySchema);
