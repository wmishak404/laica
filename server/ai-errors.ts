export const AI_PROVIDER_QUOTA_EXHAUSTED = "AI_PROVIDER_QUOTA_EXHAUSTED";

export class AIProviderQuotaError extends Error {
  provider: string;
  cause: unknown;

  constructor(provider: string, cause?: unknown) {
    super(`${provider} provider quota exhausted`);
    this.name = "AIProviderQuotaError";
    this.provider = provider;
    this.cause = cause;
  }
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function isOpenAIInsufficientQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    type?: unknown;
    error?: {
      code?: unknown;
      type?: unknown;
    };
  };

  const values = [
    readString(candidate.code),
    readString(candidate.type),
    readString(candidate.error?.code),
    readString(candidate.error?.type),
  ];

  return values.includes("insufficient_quota");
}

export function throwOpenAIProviderError(error: unknown, fallbackMessage: string): never {
  if (isOpenAIInsufficientQuotaError(error)) {
    throw new AIProviderQuotaError("OpenAI", error);
  }

  throw new Error(fallbackMessage);
}
