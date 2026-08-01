// Model used for AI-assisted translation generation
// (services/aiTranslationService.ts) when an application hasn't configured
// its own via ApplicationSetting.aiModel — also the schema default applied
// when a new ApplicationSetting document is created without one.
export const DEFAULT_AI_MODEL = "gpt-4o-mini";
