import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

const contentSchema = new mongoose.Schema(
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
  },
  { timestamps: true },
);

contentSchema.plugin(softDeletePlugin);

export default mongoose.model("Content", contentSchema);
