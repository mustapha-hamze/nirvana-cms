import ApplicationSetting from "../src/models/application/ApplicationSetting.js";
import { DEFAULT_AI_MODEL } from "../src/constants/ai.js";

describe("ApplicationSetting model — aiModel", () => {
  test("defaults to DEFAULT_AI_MODEL on a new document", () => {
    const doc = new ApplicationSetting({ application: "app-1" });
    expect(doc.aiModel).toBe(DEFAULT_AI_MODEL);
  });

  test("keeps an explicitly provided model instead of the default", () => {
    const doc = new ApplicationSetting({ application: "app-1", aiModel: "gpt-4o" });
    expect(doc.aiModel).toBe("gpt-4o");
  });

  test("is not select:false — unlike aiApiKey it has no reason to be excluded by default", () => {
    const path = ApplicationSetting.schema.path("aiModel") as any;
    expect(path.options.select).not.toBe(false);
    const apiKeyPath = ApplicationSetting.schema.path("aiApiKey") as any;
    expect(apiKeyPath.options.select).toBe(false);
  });
});
