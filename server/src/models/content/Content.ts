import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

export interface ContentDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  categories: mongoose.Types.ObjectId[];
  tags: mongoose.Types.ObjectId[];
  author: mongoose.Types.ObjectId | null;
  isDeleted: boolean;
}

const contentSchema = new mongoose.Schema<ContentDoc>(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    // Shared across every language translation of this content — a piece of
    // content belongs to the same category regardless of which language you
    // read it in, so this lives on the parent, not on ContentDetails.
    categories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      default: [],
    },
    // Same reasoning as categories — shared across every language translation.
    tags: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
      default: [],
    },
    // The content's writer — a single admin-managed Author entity, not the
    // free-text per-language byline in ContentDetails.metadata.author (which
    // stays independent; see Author model comment). Shared across every
    // language translation, same rationale as categories/tags.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      default: null,
    },
  },
  { timestamps: true },
);

contentSchema.plugin(softDeletePlugin);

export default mongoose.model<ContentDoc>("Content", contentSchema);
