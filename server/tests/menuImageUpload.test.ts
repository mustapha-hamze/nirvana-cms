import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { saveMenuCategoryImage, saveMenuItemImage, MENU_IMAGE_MAX_BYTES } from "../src/utils/menuImageUpload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATEGORY_STORAGE_ROOT = path.resolve(__dirname, "../storage/images/menu/categories");
const ITEM_STORAGE_ROOT = path.resolve(__dirname, "../storage/images/menu/items");

// Tracks exactly the files *this test file* writes, so cleanup can remove
// only those — never a blanket `readdir`-and-delete-everything, which would
// also wipe real, unrelated uploads already sitting in shared storage.
const written: { root: string; filename: string }[] = [];

async function readSaved(root: string, filename: string) {
  written.push({ root, filename });
  return fs.readFile(path.join(root, filename));
}

describe("saveMenuCategoryImage / saveMenuItemImage", () => {
  afterEach(async () => {
    await Promise.all(written.map(({ root, filename }) => fs.rm(path.join(root, filename), { force: true })));
    written.length = 0;
  });

  test("returns a bare .png filename, not a URL or path", async () => {
    const small = await sharp({ create: { width: 100, height: 80, channels: 3, background: "#ffffff" } }).png().toBuffer();

    const filename = await saveMenuCategoryImage(small, "image/png");

    expect(filename).toMatch(/^[^/\\]+\.png$/);
    await readSaved(CATEGORY_STORAGE_ROOT, filename);
  });

  test("downscales an oversized image to 1024x1024 max", async () => {
    const oversized = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: "#336699" } }).png().toBuffer();

    const filename = await saveMenuCategoryImage(oversized, "image/png");
    const saved = await readSaved(CATEGORY_STORAGE_ROOT, filename);
    const metadata = await sharp(saved).metadata();

    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(512);
  });

  test("never upscales an image already smaller than 1024x1024", async () => {
    const small = await sharp({ create: { width: 100, height: 80, channels: 3, background: "#ffffff" } }).png().toBuffer();

    const filename = await saveMenuCategoryImage(small, "image/png");
    const saved = await readSaved(CATEGORY_STORAGE_ROOT, filename);
    const metadata = await sharp(saved).metadata();

    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(80);
  });

  test("rejects a non-PNG mimetype even if the buffer is a valid image", async () => {
    const jpeg = await sharp({ create: { width: 100, height: 100, channels: 3, background: "#ffffff" } }).jpeg().toBuffer();

    await expect(saveMenuCategoryImage(jpeg, "image/jpeg")).rejects.toMatchObject({ status: 400 });
  });

  test("rejects a buffer that isn't a real image", async () => {
    await expect(saveMenuCategoryImage(Buffer.from("not an image"), "image/png")).rejects.toMatchObject({
      status: 400,
    });
  });

  test("rejects a PNG that's still over 512KB after resize/re-encode", async () => {
    // High-entropy random noise compresses poorly, so a full 1024x1024 PNG of
    // it stays well over the 512KB cap even at max compression — unlike a
    // flat-color image, which would compress down to almost nothing.
    const noisy = Buffer.alloc(1024 * 1024 * 3);
    for (let i = 0; i < noisy.length; i++) noisy[i] = Math.floor(Math.random() * 256);
    const oversizedPng = await sharp(noisy, { raw: { width: 1024, height: 1024, channels: 3 } }).png({ compressionLevel: 0 }).toBuffer();
    expect(oversizedPng.length).toBeGreaterThan(MENU_IMAGE_MAX_BYTES);

    await expect(saveMenuCategoryImage(oversizedPng, "image/png")).rejects.toMatchObject({ status: 400 });
  });

  test("saveMenuItemImage stores under the items subfolder, not categories", async () => {
    const small = await sharp({ create: { width: 50, height: 50, channels: 3, background: "#ffffff" } }).png().toBuffer();

    const filename = await saveMenuItemImage(small, "image/png");

    await readSaved(ITEM_STORAGE_ROOT, filename);
    await expect(fs.access(path.join(ITEM_STORAGE_ROOT, filename))).resolves.toBeUndefined();
  });
});
