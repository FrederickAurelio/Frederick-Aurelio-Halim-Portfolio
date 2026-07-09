import { getOpenRouterConfig, getRagMaxContextChunks } from "@/lib/openrouter/config";
import { createEmbedding } from "@/lib/openrouter/embeddings";

import { cosineSimilarity } from "./cosine";
import { loadKnowledgeIndex } from "./load-index";
import { buildRagSystemPrompt } from "./prompt";
import type { RetrievalPlan, RetrievalTopic } from "./retrieval-plan";
import type { KnowledgeChunkRecord, RetrievedChunk } from "./types";

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  maxScore: number;
  systemPrompt: string;
  plan: RetrievalPlan;
};

const PER_TOPIC_TOP_K = 2;
const TOP_UP_SCORE = 0.85;

const GLANCE_SECTION_IDS = [
  "at-a-glance",
  "overview",
  "mufy-at-a-glance",
  "where-to-start",
] as const;

type ScoredChunk = RetrievedChunk & {
  docId: string;
  sectionId: string;
};

function toRetrieved(chunk: ScoredChunk): RetrievedChunk {
  return {
    id: chunk.id,
    source: chunk.source,
    section: chunk.section,
    text: chunk.text,
    score: chunk.score,
    topicLabel: chunk.topicLabel,
  };
}

function excludeCorpus(
  chunks: KnowledgeChunkRecord[],
  excludeDocIds: string[],
): KnowledgeChunkRecord[] {
  if (excludeDocIds.length === 0) return chunks;
  const excluded = new Set(excludeDocIds);
  return chunks.filter((chunk) => !excluded.has(chunk.docId));
}

function focusCorpus(
  chunks: KnowledgeChunkRecord[],
  preferDocIds: string[],
): KnowledgeChunkRecord[] {
  if (preferDocIds.length === 0) return chunks;
  const focused = new Set(preferDocIds);
  const inFocus = chunks.filter((chunk) => focused.has(chunk.docId));
  return inFocus.length > 0 ? inFocus : chunks;
}

function scoreTopK(
  corpus: KnowledgeChunkRecord[],
  vector: number[],
  topK: number,
  topicLabel: string,
): ScoredChunk[] {
  return corpus
    .map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      section: chunk.section,
      text: chunk.text,
      docId: chunk.docId,
      sectionId: chunk.sectionId,
      score: cosineSimilarity(vector, chunk.vector),
      topicLabel,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function mergeTopicResults(
  perTopic: ScoredChunk[][],
  cap: number,
): ScoredChunk[] {
  const byId = new Map<string, ScoredChunk>();

  for (const group of perTopic) {
    for (const chunk of group) {
      const existing = byId.get(chunk.id);
      if (!existing || chunk.score > existing.score) {
        byId.set(chunk.id, chunk);
      }
    }
  }

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, cap);
}

function sectionLooksLikeGlance(sectionId: string): boolean {
  return GLANCE_SECTION_IDS.some(
    (id) =>
      sectionId === id ||
      sectionId.endsWith(`-${id}`) ||
      id.endsWith(`-${sectionId}`),
  );
}

export function pickGlanceChunk(
  chunks: KnowledgeChunkRecord[],
  docId: string,
): KnowledgeChunkRecord | undefined {
  const inDoc = chunks.filter((chunk) => chunk.docId === docId);
  const glance = inDoc.find(
    (chunk) =>
      sectionLooksLikeGlance(chunk.sectionId) && !chunk.id.includes("-part-"),
  );
  if (glance) return glance;
  const glancePart = inDoc.find((chunk) =>
    sectionLooksLikeGlance(chunk.sectionId),
  );
  if (glancePart) return glancePart;
  return inDoc.find((chunk) => !chunk.id.includes("-part-")) ?? inDoc[0];
}

export function applyEmptyTopicTopUp(
  merged: ScoredChunk[],
  topics: RetrievalTopic[],
  corpus: KnowledgeChunkRecord[],
  cap: number,
): ScoredChunk[] {
  const result = [...merged];
  const seen = new Set(result.map((chunk) => chunk.id));

  for (const topic of topics) {
    const preferDocId = topic.preferDocId;
    if (!preferDocId) continue;

    const hasDoc = result.some((chunk) => chunk.docId === preferDocId);
    if (hasDoc) continue;

    const glance = pickGlanceChunk(corpus, preferDocId);
    if (!glance || seen.has(glance.id)) continue;

    seen.add(glance.id);
    result.push({
      id: glance.id,
      source: glance.source,
      section: glance.section,
      text: glance.text,
      docId: glance.docId,
      sectionId: glance.sectionId,
      score: TOP_UP_SCORE,
      topicLabel: topic.label,
    });
  }

  return result.sort((a, b) => b.score - a.score).slice(0, cap);
}

async function isCancelled(
  signal?: AbortSignal,
  shouldStop?: () => boolean | Promise<boolean>,
): Promise<boolean> {
  if (signal?.aborted) return true;
  if (!shouldStop) return false;
  try {
    return await shouldStop();
  } catch {
    return false;
  }
}

function preferIdsForTopic(
  topic: RetrievalTopic,
  plan: RetrievalPlan,
): string[] {
  const ids = [
    ...(topic.preferDocId ? [topic.preferDocId] : []),
    ...plan.prefer_doc_ids,
  ];
  return [...new Set(ids)];
}

export async function retrieveWithPlan(
  plan: RetrievalPlan,
  userMessage: string,
  signal?: AbortSignal,
  shouldStop?: () => boolean | Promise<boolean>,
): Promise<RetrievalResult> {
  if (await isCancelled(signal, shouldStop)) {
    throw new DOMException("Aborted", "AbortError");
  }

  const index = loadKnowledgeIndex();
  const { embeddingModel } = getOpenRouterConfig() ?? {};
  if (embeddingModel && index.embeddingModel !== embeddingModel) {
    throw new Error(
      `Knowledge index was built with ${index.embeddingModel} but OPENROUTER_EMBEDDING_MODEL is ${embeddingModel}. Run npm run index-knowledge.`,
    );
  }

  const maxChunks = Math.min(getRagMaxContextChunks(), 12);
  const baseCorpus = excludeCorpus(index.chunks, plan.exclude_doc_ids);

  if (plan.off_topic || plan.topics.length === 0) {
    return {
      chunks: [],
      maxScore: 0,
      systemPrompt: buildRagSystemPrompt([], userMessage, plan.answer_hint),
      plan,
    };
  }

  const queries = plan.topics.map((topic) => topic.query);
  let embeddings: { vector: number[] }[] = [];
  try {
    embeddings = await createEmbedding(queries, signal);
  } catch {
    embeddings = [];
  }

  const perTopic: ScoredChunk[][] = [];

  for (let i = 0; i < plan.topics.length; i += 1) {
    const topic = plan.topics[i];
    const vector = embeddings[i]?.vector;
    if (!vector) {
      perTopic.push([]);
      continue;
    }

    const prefer = preferIdsForTopic(topic, plan);
    let hits = scoreTopK(
      focusCorpus(baseCorpus, prefer),
      vector,
      PER_TOPIC_TOP_K,
      topic.label,
    );

    if (hits.length === 0 && prefer.length > 0) {
      hits = scoreTopK(baseCorpus, vector, PER_TOPIC_TOP_K, topic.label);
    }

    perTopic.push(hits);
  }

  let merged = mergeTopicResults(perTopic, maxChunks);
  merged = applyEmptyTopicTopUp(merged, plan.topics, baseCorpus, maxChunks);

  const chunks = merged.map(toRetrieved);
  const maxScore = chunks[0]?.score ?? 0;

  return {
    chunks,
    maxScore,
    systemPrompt: buildRagSystemPrompt(chunks, userMessage, plan.answer_hint),
    plan,
  };
}
