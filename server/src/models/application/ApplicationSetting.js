import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";

const applicationSettingSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },
    domain: { type: String, trim: true, default: "" },
    // Sensitive — excluded from query results by default; use .select('+aiApiKey') to include
    aiApiKey: { type: String, trim: true, default: "", select: false },
    googleAnalyticsScript: { type: String, default: "" },
  },
  { timestamps: true },
);

applicationSettingSchema.plugin(softDeletePlugin);

export default mongoose.model("ApplicationSetting", applicationSettingSchema);
