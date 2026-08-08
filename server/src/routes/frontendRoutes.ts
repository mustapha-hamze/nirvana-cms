import { Router } from "express";
import { frontendRateLimiter } from "../middleware/rateLimit.js";
import { resolveFrontendApp } from "../middleware/resolveFrontendApp.js";
import {
  getFrontendSettings,
  getFrontendCategories,
  getFrontendTags,
  getFrontendAuthors,
  getFrontendAuthor,
  getFrontendAuthorContents,
  getFrontendContents,
  getFrontendContent,
  getFrontendPages,
  getFrontendPage,
} from "../controllers/frontendController.js";

const router = Router();

// Public, unauthenticated — the consuming website has no logged-in user of
// its own. Every route is scoped to one application via ?appKey=, resolved
// once here rather than repeated in each handler.
//
// The rate limiter runs before resolveFrontendApp specifically so that
// requests with an invalid/guessed appKey are still counted and throttled —
// resolveFrontendApp responds directly (400/404) without calling next() on
// those, so a limiter registered after it would never see them.
router.use(frontendRateLimiter);
router.use(resolveFrontendApp);

router.get("/settings", getFrontendSettings);
router.get("/categories", getFrontendCategories);
router.get("/tags", getFrontendTags);
router.get("/authors", getFrontendAuthors);
router.get("/authors/:idOrSlug/contents", getFrontendAuthorContents);
router.get("/authors/:idOrSlug", getFrontendAuthor);
router.get("/contents", getFrontendContents);
router.get("/contents/:idOrSlug", getFrontendContent);
router.get("/pages", getFrontendPages);
router.get("/pages/:idOrSlug", getFrontendPage);

export default router;
