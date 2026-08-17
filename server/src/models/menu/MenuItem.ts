import mongoose from "mongoose";
import { LANGUAGE_VALUES } from "../../constants/languages.js";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

export interface MenuItemTranslation {
  langKey: string;
  title: string;
  description: string;
  slug?: string;
}

export interface MenuItemDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  menu: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  publicId: string;
  image: string;
  price: number;
  calories?: number;
  status: string;
  availability: string;
  sortOrder: number;
  translations: mongoose.Types.DocumentArray<MenuItemTranslation>;
  ingredients: string[];
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  spicyLevel: number;
  isDeleted: boolean;
}

// Same embedded-translations shape as Category/MenuCategory. `slug` is
// optional here (unlike MenuCategory) — items aren't looked up by slug on
// the public API in this module, it's kept only for shape consistency/future
// use, so it's auto-derived when a title is present but never required.
const translationSchema = new mongoose.Schema(
  {
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
  },
  { _id: false },
);

const menuItemSchema = new mongoose.Schema<MenuItemDoc>(
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
    },
    // Short, random, non-sequential id — safe to expose in public frontend URLs
    // instead of the Mongo _id.
    publicId: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    calories: { type: Number, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    availability: {
      type: String,
      enum: ["available", "unavailable", "sold_out"],
      default: "available",
    },
    sortOrder: { type: Number, default: 0 },
    translations: {
      type: [translationSchema],
      validate: {
        validator: (arr: unknown[]) => arr.length > 0,
        message: "At least one language translation is required",
      },
    },
    ingredients: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isSpicy: { type: Boolean, default: false },
    // Only meaningful when isSpicy is true — left at 0 otherwise.
    spicyLevel: { type: Number, min: 0, max: 3, default: 0 },
  },
  { timestamps: true },
);

menuItemSchema.index({ application: 1, menu: 1, category: 1 });
// Sparse: translations.slug is optional, so documents/languages without one
// don't collide with each other under this unique index.
menuItemSchema.index(
  { application: 1, menu: 1, "translations.langKey": 1, "translations.slug": 1 },
  { unique: true, sparse: true },
);

menuItemSchema.plugin(softDeletePlugin);

export default mongoose.model<MenuItemDoc>("MenuItem", menuItemSchema);
