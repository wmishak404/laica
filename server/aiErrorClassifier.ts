import { z } from "zod";
import { AI_PROVIDER_QUOTA_EXHAUSTED, AIProviderQuotaError } from "./ai-errors";

export type AiErrorClass =
  | "validation"
  | "auth"
  | "not_found"
  | "payload_too_large"
  | "product_precondition"
  | "rate_limit"
  | "upstream_timeout"
  | "upstream_5xx"
  | "upstream_auth"
  | "network"
  | "unknown";

export type AiErrorVendor = "openai" | "elevenlabs" | "whisper" | "internal";

export interface ClassifiedAiError {
  errorClass: AiErrorClass;
  errorCode: string | null;
  httpStatus: number;
  retryAfterSeconds: number | null;
  vendor: AiErrorVendor;
}

interface ClassifyAiErrorContext {
  vendor: AiErrorVendor;
}

const NETWORK_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENETUNREACH",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNestedRecord(value: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  return value ? readRecord(value[key]) : null;
}

function getHttpStatus(error: unknown): number | null {
  if (error instanceof z.ZodError) {
    return 400;
  }

  if (error instanceof AIProviderQuotaError) {
    return 503;
  }

  const record = readRecord(error);
  const response = getNestedRecord(record, "response");

  const candidates = [
    readNumber(record?.status),
    readNumber(record?.statusCode),
    readNumber(response?.status),
    readNumber(response?.statusCode),
  ];

  const status = candidates.find((candidate) => candidate && candidate >= 400 && candidate <= 599);
  return status ?? null;
}

function getErrorCode(error: unknown): string | null {
  if (error instanceof z.ZodError) {
    return "ZOD_VALIDATION";
  }

  if (error instanceof AIProviderQuotaError) {
    return AI_PROVIDER_QUOTA_EXHAUSTED;
  }

  const record = readRecord(error);
  const nestedError = getNestedRecord(record, "error");
  const response = getNestedRecord(record, "response");
  const responseData = getNestedRecord(response, "data");
  const responseBody = getNestedRecord(response, "body");

  const candidate = [
    readString(record?.code),
    readString(record?.errorCode),
    readString(nestedError?.code),
    readString(responseData?.code),
    readString(responseBody?.code),
  ].find(Boolean);

  if (!candidate) {
    return null;
  }

  const safeCode = candidate.replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 128);
  return safeCode.length > 0 ? safeCode : null;
}

function parseRetryAfter(value: unknown): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue === "number" && Number.isFinite(rawValue) && rawValue > 0) {
    return Math.min(3600, Math.ceil(rawValue));
  }

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return null;
  }

  const seconds = Number.parseInt(rawValue, 10);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(3600, seconds);
  }

  const retryAt = Date.parse(rawValue);
  if (!Number.isNaN(retryAt)) {
    return Math.min(3600, Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)));
  }

  return null;
}

function getHeaderValue(headers: unknown, headerName: string): unknown {
  const headerRecord = readRecord(headers);
  if (!headerRecord) {
    return null;
  }

  const direct = headerRecord[headerName];
  if (typeof direct !== "undefined") {
    return direct;
  }

  const lower = headerName.toLowerCase();
  const matchingKey = Object.keys(headerRecord).find((key) => key.toLowerCase() === lower);
  return matchingKey ? headerRecord[matchingKey] : null;
}

function getRetryAfterSeconds(error: unknown): number | null {
  const record = readRecord(error);
  const response = getNestedRecord(record, "response");

  return (
    parseRetryAfter(record?.retryAfter) ??
    parseRetryAfter(getHeaderValue(record?.headers, "retry-after")) ??
    parseRetryAfter(getHeaderValue(response?.headers, "retry-after"))
  );
}

function hasNetworkShape(error: unknown, errorCode: string | null): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (errorCode && NETWORK_ERROR_CODES.has(errorCode.toUpperCase())) {
    return true;
  }

  if (error instanceof Error) {
    return /failed to fetch|networkerror|network request failed|load failed|socket hang up/i.test(error.message);
  }

  return false;
}

function getErrorClass(
  status: number | null,
  errorCode: string | null,
  error: unknown,
  context: ClassifyAiErrorContext,
): AiErrorClass {
  if (error instanceof z.ZodError) {
    return "validation";
  }

  if (error instanceof AIProviderQuotaError) {
    return "upstream_auth";
  }

  if (hasNetworkShape(error, errorCode)) {
    return "network";
  }

  if (errorCode === "RATE_LIMITED" || status === 429) {
    return "rate_limit";
  }

  if (status === 400) {
    return "validation";
  }

  if (status === 401 || status === 403) {
    if (errorCode === "LINKED_ACCOUNT_REQUIRED") {
      return "product_precondition";
    }

    return context.vendor === "internal" ? "auth" : "upstream_auth";
  }

  if (status === 404) {
    return "not_found";
  }

  if (status === 413) {
    return "payload_too_large";
  }

  if (status === 422) {
    return "product_precondition";
  }

  if (status === 408 || status === 504 || /timeout/i.test(errorCode ?? "")) {
    return "upstream_timeout";
  }

  if (status && status >= 500) {
    return "upstream_5xx";
  }

  return "unknown";
}

function getVendor(errorClass: AiErrorClass, error: unknown, context: ClassifyAiErrorContext): AiErrorVendor {
  if (error instanceof AIProviderQuotaError) {
    return /eleven/i.test(error.provider) ? "elevenlabs" : "openai";
  }

  if (
    errorClass === "validation" ||
    errorClass === "auth" ||
    errorClass === "not_found" ||
    errorClass === "payload_too_large" ||
    errorClass === "product_precondition"
  ) {
    return "internal";
  }

  return context.vendor;
}

export function classifyAiError(error: unknown, context: ClassifyAiErrorContext): ClassifiedAiError {
  const httpStatus = getHttpStatus(error);
  const errorCode = getErrorCode(error);
  const errorClass = getErrorClass(httpStatus, errorCode, error, context);

  return {
    errorClass,
    errorCode,
    httpStatus: httpStatus ?? (errorClass === "network" ? 503 : 500),
    retryAfterSeconds: getRetryAfterSeconds(error),
    vendor: getVendor(errorClass, error, context),
  };
}
