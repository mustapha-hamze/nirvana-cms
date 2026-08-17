import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  getMenus,
  getMenu,
  createMenu,
  updateMenu,
  updateMenuStatus,
  deleteMenu,
  getMenuPublicUrl,
} from "../controllers/menuController.js";
import { getMenuQrCode } from "../controllers/menuQrController.js";

const router = Router();

// SuperAdmin (any application) or WebSiteAdmin assigned to the target application —
// enforced per-request in the controller via userCanAccessApplication. Menus are
// admin-only end to end, same as Categories/Tags.
router.use(authenticate, requireAdmin);

router.get("/", getMenus);
router.get("/:id", getMenu);
router.post("/", createMenu);
router.put("/:id", updateMenu);
router.patch("/:id/status", updateMenuStatus);
router.delete("/:id", deleteMenu);
router.get("/:id/public-url", getMenuPublicUrl);
router.get("/:id/qr-code", getMenuQrCode);

export default router;
