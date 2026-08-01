import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import { LANGUAGE_NAMES } from "../constants/languages.js";
import { DEFAULT_AI_MODEL } from "../constants/ai.js";
import {
  mergeContentTranslation,
  mergePageTranslation,
  stripForPrompt,
  type ContentTranslationDraft,
  type PageTranslationDraft,
} from "./translatableFieldsService.js";

// Thrown with an HTTP status baked in so controllers can just let it
// propagate — app.ts's error middleware already formats any thrown error
// using `err.status`/`err.message` for anything below 500 (see the `throw
// err` pattern already used throughout contentController.ts/pageController.ts).
export class AiTranslationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiTranslationError";
    this.status = status;
  }
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30000;

type GenerateArgs = {
  applicationId: any;
  sourceDetail: any;
  sourceLangKey: string;
  targetLangKey: string;
  // Content-only: category/tag titles, included in the prompt as light
  // context when the caller has them (e.g. from a populated Content doc).
  topics?: string[];
};

async function loadAiContext(applicationId: any) {
  const [application, settings] = await Promise.all([
    Application.findById(applicationId).select("name description"),
    // Mixing "+aiApiKey" (force-include a select:false field) with plain
    // field names switches the whole projection to inclusion-only — every
    // field this call needs must be listed here, or it comes back undefined.
    ApplicationSetting.findOne({ application: applicationId }).select("+aiApiKey domain aiModel"),
  ]);
  const apiKey = settings?.aiApiKey?.trim();
  if (!apiKey) {
    throw new AiTranslationError(
      "AI translation is not configured for this application. Add an AI API key in the application settings.",
      400,
    );
  }
  return {
    apiKey,
    // Documents saved before `aiModel` existed won't have it populated on
    // read (Mongoose only applies schema defaults to new documents) — fall
    // back the same way here as the schema default does for new ones.
    model: settings?.aiModel?.trim() || DEFAULT_AI_MODEL,
    appName: application?.name ?? "",
    appDescription: application?.description ?? "",
    appDomain: settings?.domain ?? "",
  };
}

type ChatMessage = { role: "system" | "user"; content: string };

function languageName(langKey: string): string {
  return LANGUAGE_NAMES[langKey as keyof typeof LANGUAGE_NAMES] ?? langKey;
}

function buildMessages({
  appName,
  appDescription,
  appDomain,
  sourceLangKey,
  targetLangKey,
  title,
  topics,
  payload,
}: {
  appName: string;
  appDescription: string;
  appDomain: string;
  sourceLangKey: string;
  targetLangKey: string;
  title: string;
  topics?: string[];
  payload: Record<string, unknown>;
}): ChatMessage[] {
  const sourceLangName = languageName(sourceLangKey);
  const targetLangName = languageName(targetLangKey);

  const system = [
    "You are a professional translator for a headless CMS.",
    "You will be given a JSON object and must return a translated JSON object of the exact same shape.",
    "Rules:",
    "- Return strict JSON only — no prose, no markdown code fences.",
    "- Never add, remove, rename, or reorder any field or array item.",
    "- Preserve elementType, type, ids, URLs, filenames, numbers, enums, and booleans exactly as given.",
    "- Only translate human-readable text intended for end users.",
    "- For fields containing HTML, preserve every HTML tag exactly and translate only the visible text between tags.",
    "- If you are unsure whether a field should be translated, leave its value unchanged.",
  ].join("\n");

  const contextLines = [
    `Application: ${appName}`,
    appDescription ? `Description: ${appDescription}` : null,
    appDomain ? `Domain: ${appDomain}` : null,
    `Title: ${title}`,
    topics && topics.length > 0 ? `Topics: ${topics.join(", ")}` : null,
    `Source language: ${sourceLangName} (${sourceLangKey})`,
    `Target language: ${targetLangName} (${targetLangKey})`,
  ].filter((line): line is string => line !== null);

  const user = [
    ...contextLines,
    "",
    `Translate the following JSON from ${sourceLangName} to ${targetLangName}. Return only the translated JSON, matching the exact same structure:`,
    "",
    JSON.stringify(payload),
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

async function callOpenAi(apiKey: string, model: string, messages: ChatMessage[]): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Network error/timeout — never surface the underlying error (could
    // reference the request, which carries the API key in its headers).
    throw new AiTranslationError("AI provider request failed", 502);
  }

  if (!response.ok) {
    throw new AiTranslationError("AI provider request failed", 502);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new AiTranslationError("AI returned an invalid response", 502);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AiTranslationError("AI returned an invalid response", 502);
  }
  try {
    return JSON.parse(content);
  } catch {
    throw new AiTranslationError("AI returned an invalid response", 502);
  }
}

export async function generateContentTranslation({
  applicationId,
  sourceDetail,
  sourceLangKey,
  targetLangKey,
  topics,
}: GenerateArgs): Promise<ContentTranslationDraft & { langKey: string }> {
  const { apiKey, model, appName, appDescription, appDomain } = await loadAiContext(applicationId);
  const payload = stripForPrompt(sourceDetail, "content");
  const messages = buildMessages({
    appName,
    appDescription,
    appDomain,
    sourceLangKey,
    targetLangKey,
    title: sourceDetail.title ?? "",
    topics,
    payload,
  });
  const aiJson = await callOpenAi(apiKey, model, messages);
  const draft = mergeContentTranslation(sourceDetail, aiJson);
  return { ...draft, langKey: targetLangKey };
}

export async function generatePageTranslation({
  applicationId,
  sourceDetail,
  sourceLangKey,
  targetLangKey,
}: GenerateArgs): Promise<PageTranslationDraft & { langKey: string }> {
  const { apiKey, model, appName, appDescription, appDomain } = await loadAiContext(applicationId);
  const payload = stripForPrompt(sourceDetail, "page");
  const messages = buildMessages({
    appName,
    appDescription,
    appDomain,
    sourceLangKey,
    targetLangKey,
    title: sourceDetail.title ?? "",
    payload,
  });
  const aiJson = await callOpenAi(apiKey, model, messages);
  const draft = mergePageTranslation(sourceDetail, aiJson);
  return { ...draft, langKey: targetLangKey };
}
