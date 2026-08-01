import type { Request, Response } from "express";
import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import User from "../models/User.js";
import { saveApplicationLogo } from "../utils/logoUpload.js";
import { generateAppKey } from "../utils/appKey.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";

export async function getApplications(req: Request, res: Response) {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const applications = await Application.find(filter).sort({ createdAt: -1 });
  res.json(applications);
}

export async function getApplication(req: Request, res: Response) {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });

  const settings = await ApplicationSetting.findOne({
    application: app._id,
  }).select("languages");
  res.json({ ...app.toObject(), languages: settings?.languages ?? LANGUAGE_VALUES });
}

export async function createApplication(req: Request, res: Response) {
  const { name, description, status } = req.body;

  if (!name) return res.status(400).json({ message: "name is required" });

  // appKey is system-generated, never accepted from the client. Collisions are
  // astronomically unlikely (unique index backs it up regardless), so a small
  // retry loop is enough rather than anything more elaborate.
  let app;
  for (let attempt = 0; !app; attempt++) {
    try {
      app = await Application.create({
        name,
        description,
        status,
        appKey: generateAppKey(),
      });
    } catch (err: any) {
      const isDuplicateAppKey = err.code === 11000 && err.keyPattern?.appKey;
      if (!isDuplicateAppKey || attempt >= 4) throw err;
    }
  }
  res.status(201).json(app);
}

export async function updateApplication(req: Request, res: Response) {
  const { name, description, status } = req.body;

  // appKey is intentionally not accepted here — it's immutable at the schema
  // level too, so this whitelist is the first of two layers, not the only one.
  const allowed: Record<string, unknown> = {};
  if (name !== undefined) allowed.name = name;
  if (description !== undefined) allowed.description = description;
  if (status !== undefined) allowed.status = status;

  const app = await Application.findByIdAndUpdate(req.params.id, allowed, {
    new: true,
    runValidators: true,
  });
  if (!app) return res.status(404).json({ message: "Application not found" });
  res.json(app);
}

export async function updateApplicationStatus(req: Request, res: Response) {
  const { status } = req.body;
  const allowedStatuses = Application.schema.path("status").enumValues as string[];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: `status must be one of: ${allowedStatuses.join(", ")}`,
    });
  }

  const app = await Application.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  );
  if (!app) return res.status(404).json({ message: "Application not found" });
  res.json(app);
}

export async function deleteApplication(req: Request, res: Response) {
  const app = await Application.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );
  if (!app) return res.status(404).json({ message: "Application not found" });

  // Cascade soft delete: settings become invisible too
  await ApplicationSetting.findOneAndUpdate(
    { application: req.params.id },
    { isDeleted: true },
  );
  // Remove reference from users so their assignments stay clean
  await User.updateMany(
    { applications: req.params.id },
    { $pull: { applications: req.params.id } },
  );

  res.status(204).send();
}

export async function uploadApplicationLogo(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: "No file provided" });

  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });

  const logoPath = await saveApplicationLogo(app._id, req.file.buffer);

  app.logo = logoPath;
  await app.save();

  res.json({ logo: app.logo });
}

// ── Settings (1-to-1 with Application) ──────────────────────────────────────

export async function getApplicationSettings(req: Request, res: Response) {
  const settings = await ApplicationSetting.findOne({
    application: req.params.id,
  }).select("+aiApiKey");

  if (!settings)
    return res
      .status(404)
      .json({ message: "Settings not found for this application" });
  res.json(settings);
}

export async function upsertApplicationSettings(req: Request, res: Response) {
  const { domain, aiApiKey, aiModel, googleAnalyticsScript, languages } = req.body;
  const appId = req.params.id;

  const appExists = await Application.exists({ _id: appId });
  if (!appExists)
    return res.status(404).json({ message: "Application not found" });

  const update: Record<string, unknown> = {};
  if (domain !== undefined) update.domain = domain;
  if (aiApiKey !== undefined) update.aiApiKey = aiApiKey;
  if (aiModel !== undefined) {
    // Not required — an application can go without AI translation entirely,
    // and when it is configured, the schema default (DEFAULT_AI_MODEL) covers
    // it. Only reject an explicitly-sent-but-blank value, rather than forcing
    // every settings save to include it.
    if (typeof aiModel !== "string" || !aiModel.trim()) {
      return res.status(400).json({ message: "aiModel must be a non-empty string" });
    }
    update.aiModel = aiModel.trim();
  }
  if (googleAnalyticsScript !== undefined)
    update.googleAnalyticsScript = googleAnalyticsScript;
  if (languages !== undefined) {
    const isValid =
      Array.isArray(languages) &&
      languages.length > 0 &&
      languages.every((l) => (LANGUAGE_VALUES as string[]).includes(l));
    if (!isValid) {
      return res.status(400).json({
        message: `languages must be a non-empty array containing only: ${LANGUAGE_VALUES.join(", ")}`,
      });
    }
    update.languages = languages;
  }

  const settings = await ApplicationSetting.findOneAndUpdate(
    { application: appId },
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).select("+aiApiKey");

  res.json(settings);
}
