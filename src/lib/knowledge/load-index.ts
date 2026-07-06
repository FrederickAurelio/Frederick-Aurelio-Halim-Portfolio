import { readFileSync } from "node:fs";
import path from "node:path";

import type { KnowledgeChunkRecord, KnowledgeIndex } from "./types";

function inferDocIdFromChunkId(id: string): string {
  return id.split("#")[0] ?? id;
}

function inferSectionIdFromChunkId(id: string): string {
  const parts = id.split("#");
  if (parts.length <= 1) return "unknown";
  const tail = parts.slice(1).join("#");
  return tail.replace(/-part-\d+$/, "");
}

function normalizeChunk(chunk: KnowledgeChunkRecord): KnowledgeChunkRecord {
  const docId = chunk.docId ?? inferDocIdFromChunkId(chunk.id);
  const sectionId = chunk.sectionId ?? inferSectionIdFromChunkId(chunk.id);
  const docType = chunk.docType ?? "general";

  return { ...chunk, docId, docType, sectionId };
}

let cachedIndex: KnowledgeIndex | null = null;

export function loadKnowledgeIndex(): KnowledgeIndex {
  if (cachedIndex) return cachedIndex;

  const indexPath = path.join(process.cwd(), "src/lib/knowledge/index.json");
  const raw = readFileSync(indexPath, "utf8");
  const parsed = JSON.parse(raw) as KnowledgeIndex;
  cachedIndex = {
    ...parsed,
    chunks: parsed.chunks.map(normalizeChunk),
  };
  return cachedIndex;
}

export function clearKnowledgeIndexCache(): void {
  cachedIndex = null;
}
