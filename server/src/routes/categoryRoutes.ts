import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = Router();

// SuperAdmin (any application) or WebSiteAdmin assigned to the target application —
// enforced per-request in the controller via userCanAccessApplication. Categories
// are admin-only end to end: content creators can neither see nor assign them.
router.use(authenticate, requireAdmin);

router.get("/", getCategories);
router.get("/:id", getCategory);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/:id/status", updateCategoryStatus);
router.delete("/:id", deleteCategory);

export default router;
