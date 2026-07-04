import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

const applicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    logo: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

applicationSchema.plugin(softDeletePlugin);

export default mongoose.model("Application", applicationSchema);
