import type { Request, Response } from "express";
import Menu from "../models/menu/Menu.js";
import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";
import { slugify } from "../utils/slugify.js";
import { paginateList, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import { buildMenuPublicUrl } from "../utils/menuPublicUrl.js";

const STATUS_VALUES = Menu.schema.path("status").enumValues as string[];
// "slug" stands in for "title" here — Menu has no per-language translations
// to search/sort by (see Menu model comment), unlike Category/Tag.
const SORT_BY_VALUES = ["slug", "createdAt"] as const;
const MAX_PUBLIC_ID_ATTEMPTS = 5;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createMenuWithPublicId(data: Record<string, unknown>) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await Menu.create({ ...data, publicId: generatePublicId() });
    } catch (err: any) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status: unknown): status is string {
  return typeof status === "string" && STATUS_VALUES.includes(status);
}

// Auto-derived slug disambiguates silently on collision — e.g. "lunch" ->
// "lunch-2" — same behavior as Category/Tag slugs. Checks soft-deleted rows
// too: they still occupy the unique index. Menu slugs aren't per-language
// (see Menu model comment), so this is scoped only to the application.
async function findAvailableMenuSlug({
  application,
  baseSlug,
  excludeId,
}: {
  application: any;
  baseSlug: string;
  excludeId?: any;
}) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await Menu.exists({
      application,
      isDeleted: { $in: [true, false] },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      slug,
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}

function validateSettingsInput(settings: unknown): string | null {
  if (settings === undefined) return null;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return "settings must be an object";
  }
  const { showCalories, showImages, showUnavailableItems } = settings as Record<string, unknown>;
  for (const [key, value] of Object.entries({ showCalories, showImages, showUnavailableItems })) {
    if (value !== undefined && typeof value !== "boolean") {
      return `settings.${key} must be a boolean`;
    }
  }
  return null;
}

export async function getMenus(req: Request, res: Response) {
  const { application, status, search, sortBy, sortOrder, page, limit } = req.query;

  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status && !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  if (sortBy && !(SORT_BY_VALUES as readonly string[]).includes(sortBy as string)) {
    return res.status(400).json({ message: `sortBy must be one of: ${SORT_BY_VALUES.join(", ")}` });
  }
  if (sortOrder && !(SORT_ORDER_VALUES as readonly string[]).includes(sortOrder as string)) {
    return res.status(400).json({ message: `sortOrder must be one of: ${SORT_ORDER_VALUES.join(", ")}` });
  }

  const filter: Record<string, unknown> = { application };
  if (status) filter.status = status;

  const menus = await Menu.find(filter);
  res.json(
    paginateList(menus, {
      idOf: (m) => m._id.toString(),
      titleOf: (m: any) => m.slug,
      createdAtOf: (m: any) => m.createdAt,
      search: search as string,
      // paginateList only special-cases sortBy === "title" — map our "slug"
      // sort onto that so it actually engages the title-search/sort path.
      sortBy: sortBy === "slug" ? "title" : (sortBy as any),
      sortOrder: sortOrder as any,
      page,
      limit,
    }),
  );
}

export async function getMenu(req: Request, res: Response) {
  const menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });
  if (!userCanAccessApplication(req.user!, menu.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(menu);
}

export async function createMenu(req: Request, res: Response) {
  const { application, slug, status, currency, settings } = req.body;

  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!slug || !slug.toString().trim()) {
    return res.status(400).json({ message: "slug is required" });
  }
  if (!currency || !currency.toString().trim()) {
    return res.status(400).json({ message: "currency is required" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  const settingsError = validateSettingsInput(settings);
  if (settingsError) return res.status(400).json({ message: settingsError });

  const resolvedSlug = await findAvailableMenuSlug({ application, baseSlug: slugify(slug.toString()) });
  const menu = await createMenuWithPublicId({
    application,
    slug: resolvedSlug,
    currency: currency.toString().trim(),
    status,
    settings,
  });
  res.status(201).json(menu);
}

export async function updateMenu(req: Request, res: Response) {
  const { slug, status, currency, settings } = req.body;

  const menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });
  if (!userCanAccessApplication(req.user!, menu.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  const settingsError = validateSettingsInput(settings);
  if (settingsError) return res.status(400).json({ message: settingsError });

  if (slug !== undefined) {
    if (!slug || !slug.toString().trim()) {
      return res.status(400).json({ message: "slug is required" });
    }
    const baseSlug = slugify(slug.toString());
    // Only re-derive when the requested slug actually differs from the
    // current one, so saving the form again doesn't needlessly shift the
    // menu's public URL/QR code.
    menu.slug =
      baseSlug === menu.slug
        ? menu.slug
        : await findAvailableMenuSlug({ application: menu.application, baseSlug, excludeId: menu._id });
  }
  if (currency !== undefined) {
    if (!currency || !currency.toString().trim()) {
      return res.status(400).json({ message: "currency is required" });
    }
    menu.currency = currency.toString().trim();
  }
  if (settings !== undefined) {
    menu.settings = { ...menu.settings, ...settings };
  }
  if (status !== undefined) menu.status = status;

  await menu.save();
  res.json(menu);
}

export async function updateMenuStatus(req: Request, res: Response) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });
  if (!userCanAccessApplication(req.user!, menu.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  menu.status = status;
  await menu.save();
  res.json(menu);
}

export async function deleteMenu(req: Request, res: Response) {
  const menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });
  if (!userCanAccessApplication(req.user!, menu.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  menu.isDeleted = true;
  await menu.save();
  res.status(204).send();
}

// Resolves the application's configured domain + appKey and builds the
// public menu URL from them — shared by getMenuPublicUrl and (in
// menuController's QR endpoint) getMenuQrCode, both of which need the same
// underlying URL.
async function resolveMenuPublicUrl(menu: InstanceType<typeof Menu>): Promise<string | null> {
  const [application, settings] = await Promise.all([
    Application.findById(menu.application).select("appKey"),
    ApplicationSetting.findOne({ application: menu.application }).select("domain"),
  ]);
  if (!application || !settings?.domain) return null;
  return buildMenuPublicUrl(settings.domain, menu.slug, application.appKey);
}

export async function getMenuPublicUrl(req: Request, res: Response) {
  const menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });
  if (!userCanAccessApplication(req.user!, menu.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const url = await resolveMenuPublicUrl(menu);
  if (!url) {
    return res
      .status(400)
      .json({ message: "Application domain is not configured. Set it before generating a menu URL." });
  }
  res.json({ url });
}


export { resolveMenuPublicUrl };
