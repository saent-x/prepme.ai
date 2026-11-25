import { describe, expect, it } from 'vitest';
import { callMinutes, PLAN_MINUTES } from './plans';

describe('callMinutes', () => {
  it('gives each plan its fixed length, with free shorter than Pro', () => {
    expect(callMinutes(false)).toBe(PLAN_MINUTES.free);
    expect(callMinutes(true)).toBe(PLAN_MINUTES.pro);
    expect(PLAN_MINUTES.free).toBeLessThan(PLAN_MINUTES.pro);
  });
});
