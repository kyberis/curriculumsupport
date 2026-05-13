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
  "google/gemini-2.0-flash": {
    id: "google/gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "Google",
    inputPricePerMToken: 0.1,
    outputPricePerMToken: 0.4,
    dailyMessageLimit: 150,
    tier: "basic" as const,
  },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;
export const MODEL_IDS = Object.keys(AVAILABLE_MODELS) as ModelId[];
export const DEFAULT_MODEL: ModelId = "anthropic/claude-sonnet-4.6";

export function isValidModel(model: string): model is ModelId {
  return model in AVAILABLE_MODELS;
}

export function getModelConfig(model: string) {
  if (!isValidModel(model)) return AVAILABLE_MODELS[DEFAULT_MODEL];
  return AVAILABLE_MODELS[model];
}
