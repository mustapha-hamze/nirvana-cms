import Tag from "../models/Tag.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";

const STATUS_VALUES = Tag.schema.path("status").enumValues;
const MAX_PUBLIC_ID_ATTEMPTS = 5;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createTagWithPublicId(data) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await Tag.create({ ...data, publicId: generatePublicId() });
    } catch (err) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status) {
  return STATUS_VALUES.includes(status);
}

export async function getTags(req, res) {
  const { application, status } = req.query;

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

  const filter = { application };
  if (status) filter.status = status;

  const tags = await Tag.find(filter).sort({ title: 1 });
  res.json(tags);
}

export async function getTag(req, res) {
  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(tag);
}

export async function createTag(req, res) {
  const { application, title, status } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!title) return res.status(400).json({ message: "title is required" });
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const tag = await createTagWithPublicId({ application, title, status });
  res.status(201).json(tag);
}

export async function updateTag(req, res) {
  const { title, status } = req.body;

  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  if (title !== undefined) tag.title = title;
  if (status !== undefined) tag.status = status;

  await tag.save();
  res.json(tag);
}

export async function updateTagStatus(req, res) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  tag.status = status;
  await tag.save();
  res.json(tag);
}

export async function deleteTag(req, res) {
  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  tag.isDeleted = true;
  await tag.save();
  res.status(204).send();
}
