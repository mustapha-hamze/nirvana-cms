import mongoose from "mongoose";
import { LANGUAGE_VALUES } from "../../constants/languages.js";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

export interface MenuCategoryTranslation {
  langKey: string;
  title: string;
  description: string;
  slug: string;
}

export interface MenuCategoryDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  menu: mongoose.Types.ObjectId;
  publicId: string;
  image: string;
  status: string;
  sortOrder: number;
  translations: mongoose.Types.DocumentArray<MenuCategoryTranslation>;
  isDeleted: boolean;
}

// Same embedded-translations shape as Category.ts — a menu category has a
// different title/description per language but no per-language publish
// status/body of its own, so an embedded array (not a separate Details
// collection) is the right fit here too.
const translationSchema = new mongoose.Schema(
  {
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    // Auto-derived from title (see menuCategoryController) — never client-supplied.
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const menuCategorySchema = new mongoose.Schema<MenuCategoryDoc>(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    // Short, random, non-sequential id — safe to expose in public frontend URLs
    // instead of the Mongo _id.
    publicId: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    sortOrder: { type: Number, default: 0 },
    translations: {
      type: [translationSchema],
      validate: {
        validator: (arr: unknown[]) => arr.length > 0,
        message: "At least one language translation is required",
      },
    },
  },
  { timestamps: true },
);

menuCategorySchema.index({ application: 1, menu: 1 });
// Multikey index: enforces one slug per (menu, language) across every
// category's translations array — scoped to the menu, not the whole
// application, so two different menus can each have their own "appetizers".
menuCategorySchema.index(
  { application: 1, menu: 1, "translations.langKey": 1, "translations.slug": 1 },
  { unique: true },
);

menuCategorySchema.plugin(softDeletePlugin);

export default mongoose.model<MenuCategoryDoc>("MenuCategory", menuCategorySchema);
