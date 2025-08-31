import { env } from '$env/dynamic/private';
import { env as pub_env } from '$env/dynamic/public';
import { StreamClient } from '@stream-io/node-sdk';

const API_KEY = pub_env.PUBLIC_STREAM_API_KEY;
const API_SECRET = env.STREAM_VIDEO_SECRET_KEY;

export const streamVideo = new StreamClient(API_KEY, API_SECRET);
