import Content from "../models/content/Content.js";
import ContentDetails from "../models/content/ContentDetails.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";

const STATUS_VALUES = ContentDetails.schema.path("status").enumValues;

function isValidStatus(status) {
  return STATUS_VALUES.includes(status);
}

async function attachDetails(contents, { langKey, status } = {}) {
  const contentIds = contents.map((c) => c._id);
  const filter = { content: { $in: contentIds } };
  if (langKey) filter.langKey = langKey;
  if (status) filter.status = status;

  const details = await ContentDetails.find(filter).sort({ langKey: 1 });

  const byContentId = new Map();
  for (const detail of details) {
    const key = detail.content.toString();
    if (!byContentId.has(key)) byContentId.set(key, []);
    byContentId.get(key).push(detail);
  }

  return contents.map((c) => ({
    ...c.toObject(),
    details: byContentId.get(c._id.toString()) ?? [],
  }));
}

export async function getContents(req, res) {
  const { application, status, langKey } = req.query;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  if (langKey && !LANGUAGE_VALUES.includes(langKey)) {
    return res
      .status(400)
      .json({
        message: `langKey must be one of: ${LANGUAGE_VALUES.join(", ")}`,
      });
  }

  const filter = { application };
  // status/langKey live on ContentDetails, so resolve matching Content ids first.
  if (status || langKey) {
    const detailFilter = {};
    if (status) detailFilter.status = status;
    if (langKey) detailFilter.langKey = langKey;
    filter._id = {
      $in: await ContentDetails.find(detailFilter).distinct("content"),
    };
  }

  const contents = await Content.find(filter).sort({ createdAt: -1 });
  res.json(await attachDetails(contents, { langKey, status }));
}

export async function getContent(req, res) {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const details = await ContentDetails.find({ content: content._id }).sort({
    langKey: 1,
  });
  res.json({ ...content.toObject(), details });
}

export async function createContent(req, res) {
  const { application, details } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!Array.isArray(details) || details.length === 0) {
    return res
      .status(400)
      .json({ message: "at least one language in details is required" });
  }
  for (const d of details) {
    if (!d.langKey || !LANGUAGE_VALUES.includes(d.langKey)) {
      return res
        .status(400)
        .json({
          message: `langKey must be one of: ${LANGUAGE_VALUES.join(", ")}`,
        });
    }
    if (!d.title)
      return res
        .status(400)
        .json({ message: "title is required for each language" });
    if (d.status !== undefined && !isValidStatus(d.status)) {
      return res
        .status(400)
        .json({
          message: `status must be one of: ${STATUS_VALUES.join(", ")}`,
        });
    }
  }

  const content = await Content.create({ application });

  try {
    // create() (not insertMany) so the pre('save') hook stamps publishedAt when created as published.
    const created = await Promise.all(
      details.map((d) =>
        ContentDetails.create({
          content: content._id,
          langKey: d.langKey,
          title: d.title,
          headline: d.headline,
          abstract: d.abstract,
          status: d.status,
        }),
      ),
    );
    res.status(201).json({ ...content.toObject(), details: created });
  } catch (err) {
    await Content.findByIdAndDelete(content._id);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate language in details" });
    }
    throw err;
  }
}

export async function deleteContent(req, res) {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  content.isDeleted = true;
  await content.save();
  await ContentDetails.updateMany(
    { content: content._id },
    { isDeleted: true },
  );

  res.status(204).send();
}

export async function upsertContentDetails(req, res) {
  const { id, langKey } = req.params;
  const { title, headline, abstract, status } = req.body;

  if (!LANGUAGE_VALUES.includes(langKey)) {
    return res
      .status(400)
      .json({
        message: `langKey must be one of: ${LANGUAGE_VALUES.join(", ")}`,
      });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!title) return res.status(400).json({ message: "title is required" });

  // Fetch-then-save (not findOneAndUpdate) so the pre('save') publishedAt hook fires.
  let detail = await ContentDetails.findOne({ content: id, langKey });
  if (!detail) detail = new ContentDetails({ content: id, langKey });

  detail.title = title;
  if (headline !== undefined) detail.headline = headline;
  if (abstract !== undefined) detail.abstract = abstract;
  if (status !== undefined) detail.status = status;

  await detail.save();
  res.json(detail);
}

export async function deleteContentDetails(req, res) {
  const { id, langKey } = req.params;

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const detail = await ContentDetails.findOneAndUpdate(
    { content: id, langKey },
    { isDeleted: true },
  );
  if (!detail)
    return res.status(404).json({ message: "Translation not found" });

  res.status(204).send();
}
