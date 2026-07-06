/**
 * Vercel Hobby rejects maxDuration > 60 from route segment exports.
 * Run before `next build` on Vercel only; Docker/VPS builds use `npm run build` (120s).
 */
import { readFileSync, writeFileSync } from "node:fs";

const VPS_MAX = 120;
const VERCEL_MAX = 60;

const routes = [
  "src/app/api/chat/route.ts",
  "src/app/api/chat/generation/stream/route.ts",
];

for (const file of routes) {
  const source = readFileSync(file, "utf8");
  const patched = source.replace(
    `export const maxDuration = ${VPS_MAX};`,
    `export const maxDuration = ${VERCEL_MAX};`,
  );

  if (patched === source) {
    throw new Error(
      `[patch-chat-max-duration] Expected export const maxDuration = ${VPS_MAX}; in ${file}`,
    );
  }

  writeFileSync(file, patched);
  console.log(`[patch-chat-max-duration] ${file}: ${VPS_MAX}s -> ${VERCEL_MAX}s`);
}
