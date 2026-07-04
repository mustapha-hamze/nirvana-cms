import { Router } from "express";
import { logoUploadMiddleware } from "../utils/logoUpload.js";
import { authenticate, requireSuperAdmin, requireAppAccess } from "../middleware/auth.js";
import {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  uploadApplicationLogo,
  getApplicationSettings,
  upsertApplicationSettings,
} from "../controllers/applicationController.js";

const router = Router();

router.use(authenticate);

// Staff assigned to this application may read its basic info (admin panel header/dashboard).
// Everything else — listing all apps, writes, settings — stays SuperAdmin-only.
router.get("/", requireSuperAdmin, getApplications);
router.get("/:id", requireAppAccess, getApplication);
router.post("/", requireSuperAdmin, createApplication);
router.put("/:id", requireSuperAdmin, updateApplication);
router.patch("/:id/status", requireSuperAdmin, updateApplicationStatus);
router.delete("/:id", requireSuperAdmin, deleteApplication);
router.post("/:id/logo", requireSuperAdmin, logoUploadMiddleware, uploadApplicationLogo);

router.get("/:id/settings", requireSuperAdmin, getApplicationSettings);
router.put("/:id/settings", requireSuperAdmin, upsertApplicationSettings);

export default router;
