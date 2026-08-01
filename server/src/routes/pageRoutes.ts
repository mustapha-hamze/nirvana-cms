import { Router } from "express";
import { authenticate, requireStaff } from "../middleware/auth.js";
import { pageImageUploadMiddleware } from "../utils/pageImageUpload.js";
import { videoUploadMiddleware, documentUploadMiddleware } from "../utils/rawFileUpload.js";
import {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  upsertPageDetails,
  deletePageDetails,
  generatePageTranslation,
  uploadPageImage,
  uploadPageVideo,
  uploadPageDocument,
} from "../controllers/pageController.js";

const router = Router();

// SuperAdmin (any application) or staff assigned to the target application —
// enforced per-request in the controller via userCanAccessApplication/
// userIsAppAdmin, same permission model as Content.
router.use(authenticate, requireStaff);

router.get("/", getPages);
router.post("/", createPage);
// Registered before '/:id' so these literal paths aren't swallowed as an :id.
router.post("/images", pageImageUploadMiddleware, uploadPageImage);
router.post("/videos", videoUploadMiddleware, uploadPageVideo);
router.post("/documents", documentUploadMiddleware, uploadPageDocument);
router.get("/:id", getPage);
router.put("/:id", updatePage);
router.delete("/:id", deletePage);
router.put("/:id/details/:langKey", upsertPageDetails);
router.delete("/:id/details/:langKey", deletePageDetails);
router.post("/:id/translations/generate", generatePageTranslation);

export default router;
