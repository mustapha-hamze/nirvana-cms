import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import User from "../models/User.js";
import { saveApplicationLogo } from "../utils/logoUpload.js";

export async function getApplications(req, res) {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const applications = await Application.find(filter).sort({ createdAt: -1 });
  res.json(applications);
}

export async function getApplication(req, res) {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });
  res.json(app);
}

export async function createApplication(req, res) {
  const { name, description, status } = req.body;

  if (!name) return res.status(400).json({ message: "name is required" });

  const app = await Application.create({ name, description, status });
  res.status(201).json(app);
}

export async function updateApplication(req, res) {
  const { name, description, status } = req.body;

  const allowed = {};
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

export async function updateApplicationStatus(req, res) {
  const { status } = req.body;
  const allowedStatuses = Application.schema.path("status").enumValues;

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

export async function deleteApplication(req, res) {
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

export async function uploadApplicationLogo(req, res) {
  if (!req.file) return res.status(400).json({ message: "No file provided" });

  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });

  const logoPath = await saveApplicationLogo(app._id, req.file.buffer);

  app.logo = logoPath;
  await app.save();

  res.json({ logo: app.logo });
}

// ── Settings (1-to-1 with Application) ──────────────────────────────────────

export async function getApplicationSettings(req, res) {
  const settings = await ApplicationSetting.findOne({
    application: req.params.id,
  }).select("+aiApiKey");

  if (!settings)
    return res
      .status(404)
      .json({ message: "Settings not found for this application" });
  res.json(settings);
}

export async function upsertApplicationSettings(req, res) {
  const { domain, aiApiKey, googleAnalyticsScript } = req.body;
  const appId = req.params.id;

  const appExists = await Application.exists({ _id: appId });
  if (!appExists)
    return res.status(404).json({ message: "Application not found" });

  const update = {};
  if (domain !== undefined) update.domain = domain;
  if (aiApiKey !== undefined) update.aiApiKey = aiApiKey;
  if (googleAnalyticsScript !== undefined)
    update.googleAnalyticsScript = googleAnalyticsScript;

  const settings = await ApplicationSetting.findOneAndUpdate(
    { application: appId },
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).select("+aiApiKey");

  res.json(settings);
}
