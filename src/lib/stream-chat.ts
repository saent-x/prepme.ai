import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
import { StreamChat } from 'stream-chat';

export const streamChat = StreamChat.getInstance(
  pubEnv.PUBLIC_STREAM_CHAT_API_KEY,
  env.STREAM_CHAT_SECRET_KEY
);
