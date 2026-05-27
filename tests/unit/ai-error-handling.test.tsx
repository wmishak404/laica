import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/queryClient';
import {
  OPEN_FEEDBACK_EVENT,
  classifyAiRequestError,
  handleAiRequestError,
  isAIServiceError,
} from '@/lib/rateLimitHandler';
import { toast } from '@/hooks/use-toast';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

function apiError(status: number, options: {
  code?: string;
  message?: string;
  error?: string;
  retryAfter?: number;
} = {}) {
  return new ApiRequestError({
    status,
    statusText: 'Status text',
    body: {
      ...(options.code ? { code: options.code } : {}),
      ...(options.message ? { message: options.message } : {}),
      ...(options.error ? { error: options.error } : {}),
    },
    responseText: options.message || options.error || 'Request failed',
    retryAfter: options.retryAfter,
  });
}

describe('authenticated AI error handling', () => {
  beforeEach(() => {
    vi.mocked(toast).mockClear();
    window.history.pushState({}, '', '/current-screen');
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    [400, 'bad-request', "I couldn't send that request correctly. Try again. If it keeps happening, send us Feedback so we can take a look."],
    [401, 'auth', 'I need you to sign in again before I can proceed.'],
    [403, 'auth', 'I need you to sign in again before I can proceed.'],
    [404, 'not-found', "I couldn't find that. It may have been removed. Refresh and try again."],
    [413, 'payload-too-large', 'That photo is too large. Choose a smaller photo or retake it, then try again.'],
    [429, 'rate-limit', 'I need to pause cooking requests briefly. Try again shortly.'],
    [500, 'service', "I couldn't finish that request right now. Try again shortly. Send us Feedback if this issue keeps persisting."],
    [503, 'service', "I couldn't finish that request right now. Try again shortly. Send us Feedback if this issue keeps persisting."],
  ])('classifies HTTP %i as %s with plain-English copy', (status, kind, description) => {
    const feedback = classifyAiRequestError(apiError(status, { code: status === 429 ? 'RATE_LIMITED' : undefined }));

    expect(feedback.kind).toBe(kind);
    expect(feedback.description).toBe(description);
  });

  it('uses product-precondition message from typed 422 responses', () => {
    const feedback = classifyAiRequestError(apiError(422, {
      code: 'SLOP_BOWL_TOO_FEW_INGREDIENTS',
      message: 'Add at least 3 ingredients before generating a Slop Bowl.',
    }));

    expect(feedback.kind).toBe('product-precondition');
    expect(feedback.description).toBe('Add at least 3 ingredients before generating a Slop Bowl.');
  });

  it('uses Retry-After to give rate-limit waits a matching time horizon', () => {
    const feedback = classifyAiRequestError(apiError(429, {
      code: 'RATE_LIMITED',
      retryAfter: 1_780,
    }));

    expect(feedback.description).toBe('I need to pause cooking requests briefly. Try again in about 30 minutes.');
  });

  it('keeps provider quota failures separate from app rate limits and guest quota', () => {
    const feedback = classifyAiRequestError(apiError(503, {
      code: 'AI_PROVIDER_QUOTA_EXHAUSTED',
      message: 'AI requests are paused on our side while provider quota is restored. This is not your guest recipe limit.',
    }));

    expect(feedback.kind).toBe('service');
    expect(feedback.title).toBe('Recipe generation is paused');
    expect(feedback.description).toBe('Laica needs more AI capacity before I can make recipes. This is on our side, not your guest limit.');
    expect(feedback.includeFeedbackLink).toBe(false);
  });

  it('classifies network failures without Feedback copy', () => {
    const feedback = classifyAiRequestError(new TypeError('Failed to fetch'));

    expect(feedback.kind).toBe('network');
    expect(feedback.description).toBe("I couldn't reach the service. Check your connection and try again.");
    expect(feedback.includeFeedbackLink).toBe(false);
  });

  it('keeps abort and cancel errors silent', () => {
    expect(classifyAiRequestError(new DOMException('Aborted', 'AbortError')).silent).toBe(true);
  });

  it.each([400, 429, 500])('does not redirect on handled HTTP %i errors', (status) => {
    handleAiRequestError(apiError(status), 'test');

    expect(window.location.pathname).toBe('/current-screen');
  });

  it('renders Feedback as a clickable event link when copy asks for Feedback', () => {
    const listener = vi.fn();
    window.addEventListener(OPEN_FEEDBACK_EVENT, listener);

    handleAiRequestError(apiError(500), 'test');
    const toastCall = vi.mocked(toast).mock.calls.at(-1)?.[0];

    render(<>{toastCall?.description}</>);
    fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(OPEN_FEEDBACK_EVENT, listener);
  });

  it('can suppress Feedback CTA copy for live-cooking callsites', () => {
    const feedback = classifyAiRequestError(apiError(500), { feedbackLink: false });

    expect(feedback.description).toBe("I couldn't finish that request right now. Try again shortly.");
    expect(feedback.includeFeedbackLink).toBe(false);
  });

  it('keeps helper compatibility for service errors without treating local throttles as API failures', () => {
    expect(isAIServiceError(apiError(503))).toBe(true);
    expect(isAIServiceError(new Error('ElevenLabs API error'))).toBe(true);
    expect(isAIServiceError(new Error('Duplicate synthesis request throttled'))).toBe(false);
  });
});
