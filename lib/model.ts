export const AVAILABLE_MODELS = {
  "anthropic/claude-sonnet-4.6": {
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    inputPricePerMToken: 3,
    outputPricePerMToken: 15,
    dailyMessageLimit: 30,
    tier: "premium" as const,
  },
  "openai/gpt-5.4": {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    provider: "OpenAI",
    inputPricePerMToken: 2.5,
    outputPricePerMToken: 15,
    dailyMessageLimit: 30,
    tier: "premium" as const,
  },
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    inputPricePerMToken: 0.15,
    outputPricePerMToken: 0.6,
    dailyMessageLimit: 150,
    tier: "basic" as const,
  },
  "google/gemini-2.5-flash": {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    inputPricePerMToken: 0.15,
    outputPricePerMToken: 0.6,
    dailyMessageLimit: 150,
    tier: "basic" as const,
  },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;
export const MODEL_IDS = Object.keys(AVAILABLE_MODELS) as ModelId[];
export const DEFAULT_MODEL: ModelId = "anthropic/claude-sonnet-4.6";

/** Cheap model for internal summarization (conversation, session, user profile). */
export const SUMMARY_MODEL: ModelId = "google/gemini-2.5-flash";

/** Retired gateway model IDs still stored on old sessions. */
const DEPRECATED_MODEL_IDS: Record<string, ModelId> = {
  "google/gemini-2.0-flash": "google/gemini-2.5-flash",
};

export function isValidModel(model: string): model is ModelId {
  return model in AVAILABLE_MODELS;
}

export function resolveModelId(model: string): ModelId {
  if (isValidModel(model)) return model;
  return DEPRECATED_MODEL_IDS[model] ?? DEFAULT_MODEL;
}

export function getModelConfig(model: string) {
  const resolved = resolveModelId(model);
  return AVAILABLE_MODELS[resolved];
}
