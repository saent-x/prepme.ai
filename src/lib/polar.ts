import { env } from '$env/dynamic/private';
import { Polar } from '@polar-sh/sdk';

export const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: 'sandbox'
});
