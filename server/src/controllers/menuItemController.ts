import type { Request, Response } from "express";
import MenuItem from "../models/menu/MenuItem.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication, userIsAppAdmin } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";
import { getAllowedLanguages } from "../services/applicationSettingsService.js";
import { saveMenuItemImage } from "../utils/menuImageUpload.js";
import {
  assertMenuInApplication,
  assertCategoryInMenu,
  isValidObjectIdString,
  validateTranslationsInput,
  resolveTranslations,
  validateNonNegativeNumber,
} from "../validators/menuValidators.js";

const STATUS_VALUES = MenuItem.schema.path("status").enumValues as string[];
const AVAILABILITY_VALUES = MenuItem.schema.path("availability").enumValues as string[];
const MAX_PUBLIC_ID_ATTEMPTS = 5;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createMenuItemWithPublicId(data: Record<string, unknown>) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await MenuItem.create({ ...data, publicId: generatePublicId() });
    } catch (err: any) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status: unknown): status is string {
  return typeof status === "string" && STATUS_VALUES.includes(status);
}

function isValidAvailability(availability: unknown): availability is string {
  return typeof availability === "string" && AVAILABILITY_VALUES.includes(availability);
}

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.map((v) => v?.toString().trim()).filter((v): v is string => Boolean(v));
}

export async function getMenuItems(req: Request, res: Response) {
  const { application, menu, category, status } = req.query;

  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (menu !== undefined && !isValidObjectIdString(menu)) {
    return res.status(400).json({ message: "menu must be a valid id" });
  }
  if (category !== undefined && !isValidObjectIdString(category)) {
    return res.status(400).json({ message: "category must be a valid id" });
  }
  if (status && !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const filter: Record<string, unknown> = { application };
  if (menu) filter.menu = menu;
  if (category) filter.category = category;
  if (status) filter.status = status;

  const items = await MenuItem.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  res.json(items);
}

export async function getMenuItem(req: Request, res: Response) {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  if (!userCanAccessApplication(req.user!, item.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(item);
}

export async function createMenuItem(req: Request, res: Response) {
  const {
    application,
    menu,
    category,
    translations,
    image,
    price,
    calories,
    availability,
    sortOrder,
    ingredients,
    allergens,
    isVegetarian,
    isVegan,
    isSpicy,
    spicyLevel,
  } = req.body;

  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!menu || !isValidObjectIdString(menu)) {
    return res.status(400).json({ message: "menu must be a valid id" });
  }
  if (!(await assertMenuInApplication(menu, application))) {
    return res.status(400).json({ message: "menu must reference a menu in the same application" });
  }
  if (!category || !isValidObjectIdString(category)) {
    return res.status(400).json({ message: "category must be a valid id" });
  }
  if (!(await assertCategoryInMenu(category, menu, application))) {
    return res.status(400).json({ message: "category must reference a category in the same menu" });
  }
  const allowedLanguages = await getAllowedLanguages(application);
  const translationsError = validateTranslationsInput(translations, allowedLanguages, {
    requireDescription: true,
  });
  if (translationsError) return res.status(400).json({ message: translationsError });

  const priceError = validateNonNegativeNumber(price, "price", { required: true });
  if (priceError) return res.status(400).json({ message: priceError });
  const caloriesError = validateNonNegativeNumber(calories, "calories");
  if (caloriesError) return res.status(400).json({ message: caloriesError });

  if (availability !== undefined && !isValidAvailability(availability)) {
    return res
      .status(400)
      .json({ message: `availability must be one of: ${AVAILABILITY_VALUES.join(", ")}` });
  }
  if (sortOrder !== undefined && !Number.isFinite(Number(sortOrder))) {
    return res.status(400).json({ message: "sortOrder must be a number" });
  }

  const resolvedTranslations = await resolveTranslations({
    Model: MenuItem,
    scope: { application, menu },
    translations,
  });
  const item = await createMenuItemWithPublicId({
    application,
    menu,
    category,
    translations: resolvedTranslations,
    image: image || "",
    price: Number(price),
    calories: calories !== undefined && calories !== null && calories !== "" ? Number(calories) : undefined,
    availability,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
    ingredients: toStringArray(ingredients),
    allergens: toStringArray(allergens),
    isVegetarian: Boolean(isVegetarian),
    isVegan: Boolean(isVegan),
    isSpicy: Boolean(isSpicy),
    spicyLevel: isSpicy && spicyLevel !== undefined ? Number(spicyLevel) : undefined,
  });
  res.status(201).json(item);
}

// Content fields any staff member with application access may edit — status
// (whether the item exists publicly at all) is handled separately below,
// gated to admins only, mirroring Content's admin-vs-staff split.
export async function updateMenuItem(req: Request, res: Response) {
  const {
    category,
    translations,
    image,
    price,
    calories,
    availability,
    sortOrder,
    ingredients,
    allergens,
    isVegetarian,
    isVegan,
    isSpicy,
    spicyLevel,
  } = req.body;

  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  if (!userCanAccessApplication(req.user!, item.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  if (category !== undefined) {
    if (!isValidObjectIdString(category)) {
      return res.status(400).json({ message: "category must be a valid id" });
    }
    if (!(await assertCategoryInMenu(category, item.menu, item.application))) {
      return res.status(400).json({ message: "category must reference a category in the same menu" });
    }
    item.category = category as any;
  }

  const priceError = validateNonNegativeNumber(price, "price");
  if (priceError) return res.status(400).json({ message: priceError });
  const caloriesError = validateNonNegativeNumber(calories, "calories");
  if (caloriesError) return res.status(400).json({ message: caloriesError });
  if (availability !== undefined && !isValidAvailability(availability)) {
    return res
      .status(400)
      .json({ message: `availability must be one of: ${AVAILABILITY_VALUES.join(", ")}` });
  }
  if (sortOrder !== undefined && !Number.isFinite(Number(sortOrder))) {
    return res.status(400).json({ message: "sortOrder must be a number" });
  }

  if (translations !== undefined) {
    const allowedLanguages = await getAllowedLanguages(item.application);
    const translationsError = validateTranslationsInput(translations, allowedLanguages, {
      requireDescription: true,
    });
    if (translationsError) return res.status(400).json({ message: translationsError });
    item.translations = (await resolveTranslations({
      Model: MenuItem,
      scope: { application: item.application, menu: item.menu },
      translations,
      existing: item.translations,
      excludeId: item._id,
    })) as any;
  }
  if (image !== undefined) item.image = image;
  if (price !== undefined) item.price = Number(price);
  if (calories !== undefined) item.calories = calories === null || calories === "" ? undefined : Number(calories);
  if (availability !== undefined) item.availability = availability;
  if (sortOrder !== undefined) item.sortOrder = Number(sortOrder);
  if (ingredients !== undefined) item.ingredients = toStringArray(ingredients) ?? [];
  if (allergens !== undefined) item.allergens = toStringArray(allergens) ?? [];
  if (isVegetarian !== undefined) item.isVegetarian = Boolean(isVegetarian);
  if (isVegan !== undefined) item.isVegan = Boolean(isVegan);
  if (isSpicy !== undefined) item.isSpicy = Boolean(isSpicy);
  if (spicyLevel !== undefined) item.spicyLevel = item.isSpicy ? Number(spicyLevel) : 0;

  await item.save();
  res.json(item);
}

// Whether the item exists publicly at all — same admin-only gate as
// Content's publish status (see CLAUDE.md: userIsAppAdmin vs
// userCanAccessApplication).
export async function updateMenuItemStatus(req: Request, res: Response) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  if (!userIsAppAdmin(req.user!, item.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  item.status = status;
  await item.save();
  res.json(item);
}

// Day-to-day "sold out" toggling — any staff member with application access,
// not admin-only (see permission decision in the plan).
export async function updateMenuItemAvailability(req: Request, res: Response) {
  const { availability } = req.body;
  if (!availability || !isValidAvailability(availability)) {
    return res
      .status(400)
      .json({ message: `availability must be one of: ${AVAILABILITY_VALUES.join(", ")}` });
  }

  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  if (!userCanAccessApplication(req.user!, item.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  item.availability = availability;
  await item.save();
  res.json(item);
}

export async function deleteMenuItem(req: Request, res: Response) {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  if (!userIsAppAdmin(req.user!, item.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  item.isDeleted = true;
  await item.save();
  res.status(204).send();
}

export async function uploadMenuItemImage(req: Request, res: Response) {
  const { application } = req.body;
  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file) return res.status(400).json({ message: "image is required" });

  const filename = await saveMenuItemImage(req.file.buffer, req.file.mimetype);
  res.status(201).json({ filename });
}
