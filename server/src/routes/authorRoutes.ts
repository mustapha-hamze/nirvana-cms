import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { authorImageUploadMiddleware } from "../utils/authorImageUpload.js";
import {
  getAuthors,
  getAuthor,
  createAuthor,
  updateAuthor,
  updateAuthorStatus,
  deleteAuthor,
  uploadAuthorAvatar,
} from "../controllers/authorController.js";

const router = Router();

// SuperAdmin (any application) or WebSiteAdmin assigned to the target application —
// enforced per-request in the controller via userCanAccessApplication. Authors are
// admin-only end to end, same as Categories/Tags: content creators can neither
// see nor assign them.
router.use(authenticate, requireAdmin);

router.get("/", getAuthors);
// Registered before '/:id' so this literal path isn't swallowed as an :id.
router.post("/images", authorImageUploadMiddleware, uploadAuthorAvatar);
router.get("/:id", getAuthor);
router.post("/", createAuthor);
router.put("/:id", updateAuthor);
router.patch("/:id/status", updateAuthorStatus);
router.delete("/:id", deleteAuthor);

export default router;
