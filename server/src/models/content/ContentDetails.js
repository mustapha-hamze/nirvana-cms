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
    langKey: { type: String, enum: LANGUAGE_VALUES, required: true },
    title: { type: String, required: true, trim: true },
    headline: { type: String, trim: true, default: "" },
    abstract: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

contentDetailsSchema.index({ content: 1, langKey: 1 }, { unique: true });

// Track the most recent time this language went live; preserved across later unpublishes.
contentDetailsSchema.pre("save", function stampPublishedAt() {
  if (this.isModified("status") && this.status === "published") {
    this.publishedAt = new Date();
  }
});

contentDetailsSchema.plugin(softDeletePlugin);

export default mongoose.model("ContentDetails", contentDetailsSchema);
