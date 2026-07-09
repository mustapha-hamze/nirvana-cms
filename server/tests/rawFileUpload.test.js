import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { saveVideo, saveDocument } from "../src/utils/rawFileUpload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.resolve(__dirname, "../storage");

const writtenPaths = [];

async function readSaved(url) {
  // url is e.g. "/storage/video/page/<uuid>.mp4" — strip the leading
  // "/storage/" to get a path relative to STORAGE_ROOT.
  const relative = url.replace(/^\/storage\//, "");
  writtenPaths.push(relative);
  return fs.readFile(path.join(STORAGE_ROOT, relative));
}

describe("saveVideo", () => {
  afterEach(async () => {
    await Promise.all(writtenPaths.map((p) => fs.rm(path.join(STORAGE_ROOT, p), { force: true })));
    writtenPaths.length = 0;
  });

  test("saves a page video under storage/video/page", async () => {
    const buffer = Buffer.from("fake mp4 bytes");
    const url = await saveVideo(buffer, "video/mp4", "page");

    expect(url).toMatch(/^\/storage\/video\/page\/.+\.mp4$/);
    const saved = await readSaved(url);
    expect(saved.equals(buffer)).toBe(true);
  });

  test("saves a content video under storage/video/content", async () => {
    const buffer = Buffer.from("fake webm bytes");
    const url = await saveVideo(buffer, "video/webm", "content");

    expect(url).toMatch(/^\/storage\/video\/content\/.+\.webm$/);
    await readSaved(url); // registers the file for cleanup above
  });
});

describe("saveDocument", () => {
  afterEach(async () => {
    await Promise.all(writtenPaths.map((p) => fs.rm(path.join(STORAGE_ROOT, p), { force: true })));
    writtenPaths.length = 0;
  });

  test("saves a page document under storage/document/page", async () => {
    const buffer = Buffer.from("%PDF-1.4 fake pdf bytes");
    const url = await saveDocument(buffer, "application/pdf", "page");

    expect(url).toMatch(/^\/storage\/document\/page\/.+\.pdf$/);
    const saved = await readSaved(url);
    expect(saved.equals(buffer)).toBe(true);
  });

  test("saves a content document under storage/document/content", async () => {
    const buffer = Buffer.from("%PDF-1.4 fake pdf bytes");
    const url = await saveDocument(buffer, "application/pdf", "content");

    expect(url).toMatch(/^\/storage\/document\/content\/.+\.pdf$/);
    await readSaved(url); // registers the file for cleanup above
  });
});
