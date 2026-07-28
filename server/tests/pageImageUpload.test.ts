import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { savePageImage } from "../src/utils/pageImageUpload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.resolve(__dirname, "../storage/images/pages");

// Same isolation convention as contentImageUpload.test.ts — track only the
// files this test file writes so cleanup never touches unrelated uploads.
const writtenFilenames: string[] = [];

async function readSaved(filename: string) {
  writtenFilenames.push(filename);
  return fs.readFile(path.join(STORAGE_ROOT, filename));
}

describe("savePageImage", () => {
  afterEach(async () => {
    await Promise.all(writtenFilenames.map((f) => fs.rm(path.join(STORAGE_ROOT, f), { force: true })));
    writtenFilenames.length = 0;
  });

  test("returns a bare filename, saved under storage/images/pages not storage/images/contents", async () => {
    const small = await sharp({
      create: { width: 100, height: 80, channels: 3, background: "#ffffff" },
    })
      .jpeg()
      .toBuffer();

    const filename = await savePageImage(small, "image/jpeg");

    expect(filename).not.toMatch(/[/\\]/);
    await readSaved(filename); // confirms the file actually landed under storage/images/pages
  });

  test("downscales an oversized image to the max dimension and shrinks its size", async () => {
    const oversized = await sharp({
      create: { width: 3000, height: 1500, channels: 3, background: "#336699" },
    })
      .png()
      .toBuffer();

    const filename = await savePageImage(oversized, "image/png");
    const saved = await readSaved(filename);
    const metadata = await sharp(saved).metadata();

    expect(metadata.width).toBe(2000);
    expect(metadata.height).toBe(1000);
    expect(saved.byteLength).toBeLessThan(oversized.byteLength);
  });

  test("rejects a buffer that isn't a real image", async () => {
    await expect(savePageImage(Buffer.from("not an image"), "image/png")).rejects.toMatchObject({
      status: 400,
    });
  });
});
