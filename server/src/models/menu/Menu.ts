import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

export interface MenuSettings {
  showCalories: boolean;
  showImages: boolean;
  showUnavailableItems: boolean;
}

export interface MenuDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  publicId: string;
  slug: string;
  // Runtime-validated against the schema's own enumValues (see
  // menuController's STATUS_VALUES), not a compile-time literal — kept as
  // `string` so a validated-at-runtime value can be assigned without a cast.
  status: string;
  currency: string;
  settings: MenuSettings;
  isDeleted: boolean;
}

const menuSettingsSchema = new mongoose.Schema(
  {
    showCalories: { type: Boolean, default: true },
    showImages: { type: Boolean, default: true },
    showUnavailableItems: { type: Boolean, default: true },
  },
  { _id: false },
);

// A Menu has no per-language translations — unlike Category/Tag, it carries
// no display title of its own (the admin UI identifies a menu by its slug),
// so it doesn't need the embedded-translations shape those models use.
const menuSchema = new mongoose.Schema<MenuDoc>(
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
    // Client-supplied and auto-disambiguated on collision (see menuController),
    // not per-language — the same slug is used in the public menu URL/QR code
    // regardless of which language a visitor views the menu in.
    slug: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    currency: { type: String, required: true, trim: true },
    settings: { type: menuSettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

menuSchema.index({ application: 1, slug: 1 }, { unique: true });

menuSchema.plugin(softDeletePlugin);

export default mongoose.model<MenuDoc>("Menu", menuSchema);
