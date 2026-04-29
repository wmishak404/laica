const PROMPT_MARKERS = [
  /###/g,
  /<\|[^|]*\|>/g,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /\[SYSTEM\]/gi,
  /\[\/SYSTEM\]/gi,
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const TOKEN_PATTERN = /\b(?:eyJ[A-Za-z0-9_-]{20,}|[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})\b/g;
const FIREBASE_UID_PATTERN = /\b[A-Za-z0-9_-]{28,}\b/g;
const MAX_LOG_STRING_LENGTH = 2_000;
const MAX_LOG_OUTPUT_LENGTH = 20_000;

export function stripPromptMarkers(value: string): string {
  return PROMPT_MARKERS.reduce((current, pattern) => current.replace(pattern, " "), value)
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePromptInput<T>(value: T): T {
  if (typeof value === "string") {
    return stripPromptMarkers(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePromptInput(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizePromptInput(item)]),
    ) as T;
  }

  return value;
}

function redactString(value: string, maxLength = MAX_LOG_STRING_LENGTH): string {
  return stripPromptMarkers(value)
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(TOKEN_PATTERN, "[redacted-token]")
    .replace(FIREBASE_UID_PATTERN, "[redacted-id]")
    .slice(0, maxLength);
}

export function redactForAiLog<T>(value: T): T {
  if (typeof value === "string") {
    return redactString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForAiLog(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactForAiLog(item)]),
    ) as T;
  }

  return value;
}

export function redactAiOutput(outputData: string): string {
  return redactString(outputData, MAX_LOG_OUTPUT_LENGTH);
}
