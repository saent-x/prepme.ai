/**
 * Every interview on a plan lasts the same fixed time. Free stays short so voice
 * minutes (the biggest AI cost) stay low; Pro gets a full-length interview.
 */
export const PLAN_MINUTES = { free: 10, pro: 30 } as const;

export const callMinutes = (premium: boolean) => (premium ? PLAN_MINUTES.pro : PLAN_MINUTES.free);
