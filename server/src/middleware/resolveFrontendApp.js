import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";

// Resolves `req.frontendApp`/`req.frontendSettings`/`req.langKey` from
// `?appKey=` (or an `x-app-key` header) + `?lang=`, shared by every public
// frontend route. An inactive application 404s exactly like a nonexistent
// one — the public site has no business distinguishing "disabled" from
// "never existed".
export async function resolveFrontendApp(req, res, next) {
  const appKey = req.query.appKey || req.headers["x-app-key"];
  if (!appKey) return res.status(400).json({ message: "appKey is required" });

  const application = await Application.findOne({ appKey, status: "active" });
  if (!application) return res.status(404).json({ message: "Application not found" });

  const settings = await ApplicationSetting.findOne({ application: application._id }).select(
    "domain googleAnalyticsScript languages",
  );
  const allowedLanguages = settings?.languages?.length ? settings.languages : LANGUAGE_VALUES;

  const { lang } = req.query;
  if (lang && !allowedLanguages.includes(lang)) {
    return res.status(400).json({ message: `lang must be one of: ${allowedLanguages.join(", ")}` });
  }

  req.frontendApp = application;
  req.frontendSettings = settings;
  req.langKey = lang || allowedLanguages[0];
  next();
}
