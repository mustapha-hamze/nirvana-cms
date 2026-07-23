import ApplicationSetting from "../models/application/ApplicationSetting.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";

// Shared by content/page/category/tag controllers wherever a create/update
// needs to validate a langKey against the application's configured
// languages — falls back to every supported language when the application
// hasn't customized its list yet.
export async function getAllowedLanguages(applicationId) {
  const settings = await ApplicationSetting.findOne({
    application: applicationId,
  }).select("languages");
  return settings?.languages?.length ? settings.languages : LANGUAGE_VALUES;
}
