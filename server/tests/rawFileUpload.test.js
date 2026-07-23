import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { saveVideo, saveDocument } from "../src/utils/rawFileUpload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.resolve(__dirname, "../storage");

const writtenPaths = [];

async function readSaved(folder, domain, filename) {
  const relative = path.join(folder, domain, filename);
  writtenPaths.push(relative);
  return fs.readFile(path.join(STORAGE_ROOT, relative));
}

describe("saveVideo", () => {
  afterEach(async () => {
    await Promise.all(writtenPaths.map((p) => fs.rm(path.join(STORAGE_ROOT, p), { force: true })));
    writtenPaths.length = 0;
  });

  test("returns a bare filename, saved under storage/videos/pages", async () => {
    const buffer = Buffer.from("fake mp4 bytes");
    const filename = await saveVideo(buffer, "video/mp4", "page");

    expect(filename).toMatch(/^.+\.mp4$/);
    const saved = await readSaved("videos", "pages", filename);
    expect(saved.equals(buffer)).toBe(true);
  });

  test("saves a content video under storage/videos/contents", async () => {
    const buffer = Buffer.from("fake webm bytes");
    const filename = await saveVideo(buffer, "video/webm", "content");

    expect(filename).toMatch(/^.+\.webm$/);
    await readSaved("videos", "contents", filename); // registers the file for cleanup above
  });
});

describe("saveDocument", () => {
  afterEach(async () => {
    await Promise.all(writtenPaths.map((p) => fs.rm(path.join(STORAGE_ROOT, p), { force: true })));
    writtenPaths.length = 0;
  });

  test("returns a bare filename, saved under storage/documents/pages", async () => {
    const buffer = Buffer.from("%PDF-1.4 fake pdf bytes");
    const filename = await saveDocument(buffer, "application/pdf", "page");

    expect(filename).toMatch(/^.+\.pdf$/);
    const saved = await readSaved("documents", "pages", filename);
    expect(saved.equals(buffer)).toBe(true);
  });

  test("saves a content document under storage/documents/contents", async () => {
    const buffer = Buffer.from("%PDF-1.4 fake pdf bytes");
    const filename = await saveDocument(buffer, "application/pdf", "content");

    expect(filename).toMatch(/^.+\.pdf$/);
    await readSaved("documents", "contents", filename); // registers the file for cleanup above
  });
});
