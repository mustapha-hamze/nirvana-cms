import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { menuImageUploadMiddleware } from "../utils/menuImageUpload.js";
import {
  getMenuCategories,
  getMenuCategory,
  createMenuCategory,
  updateMenuCategory,
  updateMenuCategoryStatus,
  deleteMenuCategory,
  uploadMenuCategoryImage,
} from "../controllers/menuCategoryController.js";

const router = Router();

// SuperAdmin (any application) or WebSiteAdmin assigned to the target application —
// enforced per-request in the controller via userCanAccessApplication. Menu
// categories are admin-only end to end, same as Categories/Menus.
router.use(authenticate, requireAdmin);

// Registered before "/:id" so the literal "images" segment isn't swallowed
// as an id (same ordering precedent as contentRoutes.ts's "/images").
router.post("/images", menuImageUploadMiddleware, uploadMenuCategoryImage);

router.get("/", getMenuCategories);
router.get("/:id", getMenuCategory);
router.post("/", createMenuCategory);
router.put("/:id", updateMenuCategory);
router.patch("/:id/status", updateMenuCategoryStatus);
router.delete("/:id", deleteMenuCategory);

export default router;
