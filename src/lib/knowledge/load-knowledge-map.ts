import type { KnowledgeMap } from "./types";

import mapJson from "./knowledge-map.json";

let cachedMap: KnowledgeMap | null = null;

export function loadKnowledgeMap(): KnowledgeMap {
  if (cachedMap) return cachedMap;
  cachedMap = mapJson as KnowledgeMap;
  return cachedMap;
}
