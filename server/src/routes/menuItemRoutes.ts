import { Router } from "express";
import { authenticate, requireStaff } from "../middleware/auth.js";
import { menuImageUploadMiddleware } from "../utils/menuImageUpload.js";
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  updateMenuItemStatus,
  updateMenuItemAvailability,
  deleteMenuItem,
  uploadMenuItemImage,
} from "../controllers/menuItemController.js";

const router = Router();

// Looser than Menu/MenuCategory: content creators can author item content
// and toggle availability (day-to-day "sold out" marking), but not change
// status (whether the item exists publicly at all) or delete — those are
// gated to admins per-request via userIsAppAdmin inside the controller,
// mirroring contentRoutes.ts's admin-vs-staff split.
router.use(authenticate, requireStaff);

// Registered before "/:id" so the literal "images" segment isn't swallowed
// as an id (same ordering precedent as contentRoutes.ts's "/images").
router.post("/images", menuImageUploadMiddleware, uploadMenuItemImage);

router.get("/", getMenuItems);
router.get("/:id", getMenuItem);
router.post("/", createMenuItem);
router.put("/:id", updateMenuItem);
router.patch("/:id/status", updateMenuItemStatus);
router.patch("/:id/availability", updateMenuItemAvailability);
router.delete("/:id", deleteMenuItem);

export default router;
