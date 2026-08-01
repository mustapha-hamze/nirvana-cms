import mongoose from "mongoose";
import { softDeletePlugin } from "../../utils/softDeletePlugin.js";
import { LANGUAGE_VALUES } from "../../constants/languages.js";
import { DEFAULT_AI_MODEL } from "../../constants/ai.js";

export interface ApplicationSettingDoc extends mongoose.Document {
  application: mongoose.Types.ObjectId;
  domain: string;
  aiApiKey: string;
  aiModel: string;
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
    // Not secret — just which OpenAI model aiTranslationService.ts calls for this
    // application, so no select: false. Falls back to DEFAULT_AI_MODEL both here
    // (new documents) and in aiTranslationService.ts (documents saved before this
    // field existed, which won't have it populated on read).
    aiModel: { type: String, trim: true, default: DEFAULT_AI_MODEL },
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
