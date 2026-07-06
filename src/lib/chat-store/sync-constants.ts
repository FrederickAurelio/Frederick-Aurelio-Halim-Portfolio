export const UPSTASH_SYNC_COOKIE = "portfolio-chat-upstash-sync";
export const UPSTASH_SYNC_HEADER = "x-upstash-sync-token";

/** Rolling sync token lifetime — matches session cookie scale. */
export const UPSTASH_SYNC_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;
