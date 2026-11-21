import { createPolar, createPolarCore } from '@polar-sh/sdk/2026-10';
import { config } from './config';

const token = config.polar.accessToken();
const options = { accessToken: token, environment: config.polar.server() };

/**
 * Null when billing is not configured; the app then runs with free-tier limits only.
 * `polarCore` is the low-level client the Better Auth plugin expects; `polarClient`
 * is the typed service client used for plan lookups.
 */
export const polarCore = token ? createPolarCore(options) : null;
export const polarClient = token ? createPolar(options) : null;
