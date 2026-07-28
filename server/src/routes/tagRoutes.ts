import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  updateTagStatus,
  deleteTag,
} from "../controllers/tagController.js";

const router = Router();

// SuperAdmin (any application) or WebSiteAdmin assigned to the target application —
// enforced per-request in the controller via userCanAccessApplication. Tags are
// admin-only end to end: content creators can neither see nor assign them.
router.use(authenticate, requireAdmin);

router.get("/", getTags);
router.get("/:id", getTag);
router.post("/", createTag);
router.put("/:id", updateTag);
router.patch("/:id/status", updateTagStatus);
router.delete("/:id", deleteTag);

export default router;
