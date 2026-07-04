import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";
import { LANGUAGE_VALUES } from "../../constants/languages.js";

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
    languages: {
      type: [{ type: String, enum: LANGUAGE_VALUES }],
      default: LANGUAGE_VALUES,
    },
  },
  { timestamps: true },
);

applicationSettingSchema.plugin(softDeletePlugin);

export default mongoose.model("ApplicationSetting", applicationSettingSchema);
