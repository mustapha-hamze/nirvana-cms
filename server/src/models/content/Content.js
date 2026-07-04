import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

const contentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
  },
  { timestamps: true },
);

contentSchema.plugin(softDeletePlugin);

export default mongoose.model("Content", contentSchema);
