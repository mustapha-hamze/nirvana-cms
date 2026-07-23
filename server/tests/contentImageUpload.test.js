import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { saveContentImage } from "../src/utils/contentImageUpload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.resolve(__dirname, "../storage/images/contents");

// Tracks exactly the files *this test file* writes, so cleanup can remove
// only those — never a blanket `readdir`-and-delete-everything, which would
// also wipe real, unrelated uploads already sitting in shared storage.
const writtenFilenames = [];

async function readSaved(filename) {
  writtenFilenames.push(filename);
  return fs.readFile(path.join(STORAGE_ROOT, filename));
}

describe("saveContentImage", () => {
  afterEach(async () => {
    await Promise.all(writtenFilenames.map((f) => fs.rm(path.join(STORAGE_ROOT, f), { force: true })));
    writtenFilenames.length = 0;
  });

  test("returns a bare filename, not a URL or path", async () => {
    const small = await sharp({
      create: { width: 100, height: 80, channels: 3, background: "#ffffff" },
    })
      .jpeg()
      .toBuffer();

    const filename = await saveContentImage(small, "image/jpeg");

    expect(filename).not.toMatch(/[/\\]/);
    await readSaved(filename); // confirms the file actually landed under storage/images/contents
  });

  test("downscales an oversized image to the max dimension and shrinks its size", async () => {
    const oversized = await sharp({
      create: { width: 3000, height: 1500, channels: 3, background: "#336699" },
    })
      .png()
      .toBuffer();

    const filename = await saveContentImage(oversized, "image/png");
    const saved = await readSaved(filename);
    const metadata = await sharp(saved).metadata();

    expect(metadata.width).toBe(2000);
    expect(metadata.height).toBe(1000);
    expect(saved.byteLength).toBeLessThan(oversized.byteLength);
  });

  test("never upscales an image already smaller than the max dimension", async () => {
    const small = await sharp({
      create: { width: 100, height: 80, channels: 3, background: "#ffffff" },
    })
      .jpeg()
      .toBuffer();

    const filename = await saveContentImage(small, "image/jpeg");
    const saved = await readSaved(filename);
    const metadata = await sharp(saved).metadata();

    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(80);
  });

  test("rejects a buffer that isn't a real image", async () => {
    await expect(saveContentImage(Buffer.from("not an image"), "image/png")).rejects.toMatchObject({
      status: 400,
    });
  });
});
