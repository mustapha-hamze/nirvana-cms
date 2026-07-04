import mongoose from "mongoose";
import { LANGUAGE_VALUES } from "../../constants/languages.js";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

const contentDetailsSchema = new mongoose.Schema(
  {
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },
    // Denormalized from Content so slug uniqueness can be enforced per-application
    // with a single compound index, without a join back to Content on every write.
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    title: { type: String, required: true, trim: true },
    // Public, URL-friendly identifier for this language's content page —
    // used instead of the Mongo id in frontend routes.
    slug: { type: String, required: true, trim: true, lowercase: true },
    headline: { type: String, trim: true, default: "" },
    abstract: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
    // Per-language SEO/byline data — a translation's meta description and
    // keywords describe THIS language's text, and the byline can legitimately
    // differ per translation (e.g. a different translator credited).
    metadata: {
      keywords: { type: [{ type: String, trim: true }], default: [] },
      author: { type: String, trim: true, default: "" },
      description: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true },
);

contentDetailsSchema.index({ content: 1, langKey: 1 }, { unique: true });
contentDetailsSchema.index({ application: 1, langKey: 1, slug: 1 }, { unique: true });

// Track the most recent time this language went live; preserved across later unpublishes.
contentDetailsSchema.pre("save", function stampPublishedAt() {
  if (this.isModified("status") && this.status === "published") {
    this.publishedAt = new Date();
  }
});

contentDetailsSchema.plugin(softDeletePlugin);

export default mongoose.model("ContentDetails", contentDetailsSchema);
