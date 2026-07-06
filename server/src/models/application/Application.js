import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

const applicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    logo: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    // System-generated on creation (see generateAppKey) and never user-editable —
    // `immutable` blocks changes after the initial set, on top of the controller
    // never accepting it as input.
    appKey: { type: String, required: true, unique: true, immutable: true },
  },
  { timestamps: true },
);

applicationSchema.plugin(softDeletePlugin);

export default mongoose.model("Application", applicationSchema);
