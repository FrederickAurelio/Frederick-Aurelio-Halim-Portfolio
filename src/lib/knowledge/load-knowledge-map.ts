import { readFileSync } from "node:fs";
import path from "node:path";

import type { KnowledgeMap } from "./types";

let cachedMap: KnowledgeMap | null = null;

export function loadKnowledgeMap(): KnowledgeMap {
  if (cachedMap) return cachedMap;

  const mapPath = path.join(process.cwd(), "src/lib/knowledge/knowledge-map.json");
  const raw = readFileSync(mapPath, "utf8");
  cachedMap = JSON.parse(raw) as KnowledgeMap;
  return cachedMap;
}
