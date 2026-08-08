import mongoose from "mongoose";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

export interface AuthorTranslation {
  langKey: string;
  bio: string;
}

export interface AuthorSocialLinks {
  linkedin: string;
  x: string;
  instagram: string;
}

export interface AuthorDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  publicId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  // Public, URL-friendly identifier for this author's profile page — derived
  // from displayName, unlike Category/Tag slugs it isn't per-language since
  // an author's name (and therefore its slug) doesn't change by language.
  slug: string;
  email: string;
  jobTitle: string;
  websiteUrl: string;
  avatar: string;
  socialLinks: AuthorSocialLinks;
  translations: mongoose.Types.DocumentArray<AuthorTranslation>;
  // Runtime-validated against the schema's own enumValues, not a compile-time
  // literal — see models/Category.ts's CategoryDoc.status for the rationale.
  status: string;
  isDeleted: boolean;
}

// Only `bio` varies by language here — unlike Category/Tag's translations
// (which carry the very identity the item is looked up by), an author's name
// is shared across every language, so this array exists purely to let a bio
// differ per translation. Optional at every level: an author with no bio yet
// simply has an empty array.
const translationSchema = new mongoose.Schema(
  {
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    bio: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const authorSchema = new mongoose.Schema<AuthorDoc>(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    // Short, random, non-sequential id — safe to expose in public frontend URLs,
    // same rationale as Category/Tag's publicId.
    publicId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: "" },
    // Defaults to "firstName lastName" but stays independently editable (e.g.
    // a pen name) — see authorController's resolveDisplayName.
    displayName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    email: { type: String, trim: true, default: "" },
    jobTitle: { type: String, trim: true, default: "" },
    websiteUrl: { type: String, trim: true, default: "" },
    // Bare filename, same convention as content/page image uploads — see
    // utils/authorImageUpload.ts.
    avatar: { type: String, trim: true, default: "" },
    socialLinks: {
      linkedin: { type: String, trim: true, default: "" },
      x: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
    },
    translations: { type: [translationSchema], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

authorSchema.index({ application: 1 });
authorSchema.index({ application: 1, slug: 1 }, { unique: true });

authorSchema.plugin(softDeletePlugin);

export default mongoose.model<AuthorDoc>("Author", authorSchema);
