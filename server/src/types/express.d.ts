import type { UserDoc } from "../models/User.js";
import type { ApplicationDoc } from "../models/application/Application.js";
import type { ApplicationSettingDoc } from "../models/application/ApplicationSetting.js";

// Declaration merging for the custom properties middleware attaches to every
// request: `user` by middleware/auth.js's `authenticate`, `frontendApp`/
// `frontendSettings`/`langKey` by middleware/resolveFrontendApp.js. Letting
// every controller reference req.user etc. without a cast.
declare global {
  namespace Express {
    interface Request {
      user?: UserDoc;
      frontendApp?: ApplicationDoc;
      frontendSettings?: ApplicationSettingDoc | null;
      langKey?: string;
    }
  }
}

export {};
