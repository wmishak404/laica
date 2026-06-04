import { Fragment, createElement, type ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { ApiRequestError } from './queryClient';

export const OPEN_FEEDBACK_EVENT = 'laica:open-feedback';

type AiErrorKind =
  | 'bad-request'
  | 'auth'
  | 'not-found'
  | 'payload-too-large'
  | 'product-precondition'
  | 'rate-limit'
  | 'service'
  | 'network'
  | 'canceled'
  | 'unknown';

interface AiErrorFeedback {
  kind: AiErrorKind;
  title: string;
  description: string;
  status?: number;
  code?: string;
  includeFeedbackLink: boolean;
  silent?: boolean;
}

interface AiErrorHandlingOptions {
  context?: string;
  feedbackLink?: boolean;
}

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function statusFor(error: unknown): number | undefined {
  if (error instanceof ApiRequestError) return error.status;

  const match = messageFor(error).match(/^(\d{3}):/);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  return /abort|cancelled|canceled/i.test(messageFor(error));
}

function hasNetworkShape(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  return /failed to fetch|networkerror|network request failed|load failed/i.test(messageFor(error));
}

function feedbackDescription(text: string, includeFeedbackLink: boolean): ReactNode {
  if (!includeFeedbackLink || !text.includes('Feedback')) {
    return text;
  }

  const [before, after] = text.split('Feedback');
  const feedbackButton = createElement(
    'button',
    {
      type: 'button',
      className: 'underline underline-offset-2 font-medium',
      onClick: () => {
        window.dispatchEvent(new CustomEvent(OPEN_FEEDBACK_EVENT));
      },
    },
    'Feedback',
  );

  return createElement(Fragment, null, before, feedbackButton, after);
}

function rateLimitDescription(error: unknown): string {
  const retryAfterSeconds = error instanceof ApiRequestError ? error.retryAfter : undefined;

  if (!retryAfterSeconds) {
    return 'I need to pause cooking requests briefly. Try again shortly.';
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);

  if (minutes <= 1) {
    return 'I need to pause cooking requests briefly. Try again in about a minute.';
  }

  if (minutes <= 5) {
    return 'I need to pause cooking requests briefly. Try again in a few minutes.';
  }

  if (minutes < 60) {
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    return `I need to pause cooking requests briefly. Try again in about ${roundedMinutes} minutes.`;
  }

  const hours = Math.max(1, Math.round(minutes / 60));
  const hourLabel = hours === 1 ? 'an hour' : `${hours} hours`;
  return `I need to pause cooking requests briefly. Try again in about ${hourLabel}.`;
}

export function classifyAiRequestError(error: unknown, options: AiErrorHandlingOptions = {}): AiErrorFeedback {
  const status = statusFor(error);
  const code = error instanceof ApiRequestError ? error.code : undefined;
  const includeFeedbackLink = options.feedbackLink !== false;

  if (isAbortError(error)) {
    return {
      kind: 'canceled',
      title: '',
      description: '',
      status,
      code,
      includeFeedbackLink: false,
      silent: true,
    };
  }

  if (status === 400) {
    return {
      kind: 'bad-request',
      title: 'Request did not go through',
      description: includeFeedbackLink
        ? "I couldn't send that request correctly. Try again. If it keeps happening, send us Feedback so we can take a look."
        : "I couldn't send that request correctly. Try again.",
      status,
      code,
      includeFeedbackLink,
    };
  }

  if (status === 401 || status === 403) {
    if (code === 'LINKED_ACCOUNT_REQUIRED') {
      const linkedAccountReason = error instanceof ApiRequestError ? error.body?.linkedAccountReason : undefined;
      const isDurableSave = linkedAccountReason === 'durable_save';

      return {
        kind: 'product-precondition',
        title: isDurableSave
          ? 'Sign in or create an account to save your ingredients and profile'
          : 'Sign up to unlock more recipes',
        description: isDurableSave
          ? (error instanceof ApiRequestError
              ? error.body?.message || 'Sign in or create an account before saving your ingredients and profile.'
              : 'Sign in or create an account before saving your ingredients and profile.')
          : 'Sign up before making more recipes.',
        status,
        code,
        includeFeedbackLink: false,
      };
    }

    if (code === 'ANONYMOUS_ACCESS_DISABLED') {
      return {
        kind: 'auth',
        title: 'Guest cooking is paused',
        description: error instanceof ApiRequestError
          ? error.body?.message || 'Continue with Google to keep cooking.'
          : 'Continue with Google to keep cooking.',
        status,
        code,
        includeFeedbackLink: false,
      };
    }

    if (code === 'APP_CHECK_REQUIRED' || code === 'APP_CHECK_INVALID') {
      return {
        kind: 'auth',
        title: 'Refresh and try again',
        description: 'I could not verify this app session. Refresh the page, then try again.',
        status,
        code,
        includeFeedbackLink: false,
      };
    }

    return {
      kind: 'auth',
      title: 'Sign in again',
      description: 'I need you to sign in again before I can proceed.',
      status,
      code,
      includeFeedbackLink: false,
    };
  }

  if (status === 404) {
    return {
      kind: 'not-found',
      title: "I couldn't find that",
      description: "I couldn't find that. It may have been removed. Refresh and try again.",
      status,
      code,
      includeFeedbackLink: false,
    };
  }

  if (status === 413) {
    return {
      kind: 'payload-too-large',
      title: 'Photo is too large',
      description: 'That photo is too large. Choose a smaller photo or retake it, then try again.',
      status,
      code,
      includeFeedbackLink: false,
    };
  }

  if (status === 422) {
    const fallback = 'I need a bit more information before I can do that.';
    const description = error instanceof ApiRequestError
      ? error.body?.message || error.body?.error || fallback
      : fallback;

    return {
      kind: 'product-precondition',
      title: 'One more thing first',
      description,
      status,
      code,
      includeFeedbackLink: false,
    };
  }

  if (code === 'AI_PROVIDER_QUOTA_EXHAUSTED') {
    return {
      kind: 'service',
      title: 'Recipe generation is paused',
      description: 'Laica needs more AI capacity before I can make recipes. This is on our side, not your guest limit.',
      status,
      code,
      includeFeedbackLink: false,
    };
  }

  if (status === 429 || code === 'RATE_LIMITED' || /rate limit|quota|too many requests/i.test(messageFor(error))) {
    return {
      kind: 'rate-limit',
      title: 'Cooking requests paused',
      description: rateLimitDescription(error),
      status,
      code,
      includeFeedbackLink: false,
    };
  }

  if (status && status >= 500) {
    return {
      kind: 'service',
      title: 'Request did not finish',
      description: includeFeedbackLink
        ? "I couldn't finish that request right now. Try again shortly. Send us Feedback if this issue keeps persisting."
        : "I couldn't finish that request right now. Try again shortly.",
      status,
      code,
      includeFeedbackLink,
    };
  }

  if (hasNetworkShape(error)) {
    return {
      kind: 'network',
      title: 'Connection issue',
      description: "I couldn't reach the service. Check your connection and try again.",
      status,
      code,
      includeFeedbackLink: false,
    };
  }

  return {
    kind: 'unknown',
    title: 'Request did not finish',
    description: includeFeedbackLink
      ? "I couldn't finish that request right now. Try again shortly. Send us Feedback if this issue keeps persisting."
      : "I couldn't finish that request right now. Try again shortly.",
    status,
    code,
    includeFeedbackLink,
  };
}

export function isRateLimitError(error: Error): boolean {
  return classifyAiRequestError(error).kind === 'rate-limit';
}

export function isAIServiceError(error: Error): boolean {
  const kind = classifyAiRequestError(error).kind;
  if (kind === 'service' || kind === 'network') {
    return true;
  }

  return kind === 'unknown' && /api|openai|elevenlabs|request failed/i.test(messageFor(error));
}

export const isAPIError = isAIServiceError;

export function handleAiRequestError(error: unknown, options: AiErrorHandlingOptions | string = {}): void {
  const normalizedOptions = typeof options === 'string' ? { context: options } : options;
  console.error(`AI request error${normalizedOptions.context ? ` in ${normalizedOptions.context}` : ''}:`, error);

  const feedback = classifyAiRequestError(error, normalizedOptions);
  if (feedback.silent) return;

  toast({
    title: feedback.title,
    description: feedbackDescription(feedback.description, feedback.includeFeedbackLink),
    variant: 'destructive',
  });
}

export async function withAiErrorHandling<T>(
  apiCall: () => Promise<T>,
  options: AiErrorHandlingOptions | string = {},
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    handleAiRequestError(error, options);
    return null;
  }
}
