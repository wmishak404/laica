import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import {
  getVisionIpRateLimitKey,
  getVisionUserRateLimitKey,
} from '../../server/rate-limit';

function makeRequest(scanType?: string): Request {
  return {
    headers: {
      ...(scanType ? { 'x-laica-scan-type': scanType } : {}),
    },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    firebaseUser: { uid: 'user-1' },
  } as unknown as Request;
}

describe('vision rate-limit keys', () => {
  it('separates Pantry and Kitchen scan meters for signed-in users', () => {
    expect(getVisionUserRateLimitKey(makeRequest('pantry'))).toBe('user-1:pantry');
    expect(getVisionUserRateLimitKey(makeRequest('kitchen'))).toBe('user-1:kitchen');
  });

  it('falls back to a generic scan meter for missing or unexpected contexts', () => {
    expect(getVisionUserRateLimitKey(makeRequest())).toBe('user-1:generic');
    expect(getVisionUserRateLimitKey(makeRequest('recipes'))).toBe('user-1:generic');
  });

  it('separates IP keys with the same scan context', () => {
    expect(getVisionIpRateLimitKey(makeRequest('pantry'))).toBe('127.0.0.1:pantry');
    expect(getVisionIpRateLimitKey(makeRequest('kitchen'))).toBe('127.0.0.1:kitchen');
  });
});
