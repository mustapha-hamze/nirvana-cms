import { Router } from "express";
import { authenticate, requireStaff } from "../middleware/auth.js";
import {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  upsertPageDetails,
  deletePageDetails,
} from "../controllers/pageController.js";

const router = Router();

// SuperAdmin (any application) or staff assigned to the target application —
// enforced per-request in the controller via userCanAccessApplication/
// userIsAppAdmin, same permission model as Content.
router.use(authenticate, requireStaff);

router.get("/", getPages);
router.post("/", createPage);
router.get("/:id", getPage);
router.put("/:id", updatePage);
router.delete("/:id", deletePage);
router.put("/:id/details/:langKey", upsertPageDetails);
router.delete("/:id/details/:langKey", deletePageDetails);

export default router;
