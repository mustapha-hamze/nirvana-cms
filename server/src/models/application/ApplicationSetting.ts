import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";
import { LANGUAGE_VALUES } from "../../constants/languages.js";

export interface ApplicationSettingDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  domain: string;
  aiApiKey: string;
  googleAnalyticsScript: string;
  languages: string[];
  isDeleted: boolean;
}

const applicationSettingSchema = new mongoose.Schema<ApplicationSettingDoc>(
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

export default mongoose.model<ApplicationSettingDoc>("ApplicationSetting", applicationSettingSchema);
