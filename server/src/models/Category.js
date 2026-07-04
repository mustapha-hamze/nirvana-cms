import mongoose from "mongoose";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

const categorySchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true },
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

categorySchema.plugin(softDeletePlugin);

export default mongoose.model("Category", categorySchema);
