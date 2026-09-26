export class ActionProposalProviderError extends Error {
  constructor(public readonly code: "provider_key_missing" | "provider_auth" | "provider_quota" | "provider_timeout" | "provider_schema" | "provider_unavailable") {
    super("action_proposal_unavailable");
  }
}
export function safeActionProviderError(error: unknown): ActionProposalProviderError {
  const value = error as { status?: number; code?: string; name?: string } | null;
  const code = value?.status === 401 ? "provider_auth"
    : value?.status === 429 ? "provider_quota"
    : value?.code === "invalid_json_schema" || value?.status === 400 ? "provider_schema"
    : value?.name === "APIConnectionTimeoutError" ? "provider_timeout"
    : "provider_unavailable";
  return new ActionProposalProviderError(code);
}
