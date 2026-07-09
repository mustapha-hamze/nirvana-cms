import { Router } from "express";
import {
  resolveFrontendApp,
  getFrontendSettings,
  getFrontendCategories,
  getFrontendTags,
  getFrontendContents,
  getFrontendContent,
  getFrontendPages,
  getFrontendPage,
} from "../controllers/frontendController.js";

const router = Router();

// Public, unauthenticated — the consuming website has no logged-in user of
// its own. Every route is scoped to one application via ?appKey=, resolved
// once here rather than repeated in each handler.
router.use(resolveFrontendApp);

router.get("/settings", getFrontendSettings);
router.get("/categories", getFrontendCategories);
router.get("/tags", getFrontendTags);
router.get("/contents", getFrontendContents);
router.get("/contents/:idOrSlug", getFrontendContent);
router.get("/pages", getFrontendPages);
router.get("/pages/:idOrSlug", getFrontendPage);

export default router;
