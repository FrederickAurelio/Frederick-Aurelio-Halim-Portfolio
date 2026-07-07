import { getOpenRouterConfig, getRagTopK, getRagMinScore } from "@/lib/openrouter/config";
import { createEmbedding } from "@/lib/openrouter/embeddings";
import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { cosineSimilarity } from "./cosine";
import { loadKnowledgeMap } from "./load-knowledge-map";
import { loadKnowledgeIndex } from "./load-index";
import { buildRagSystemPrompt } from "./prompt";
import type { RetrievalPlan } from "./retrieval-plan";
import type { KnowledgeChunkRecord, RetrievedChunk } from "./types";

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  maxScore: number;
  shouldRefuse: boolean;
  systemPrompt: string;
  plan: RetrievalPlan;
};

const LIST_PROJECTS_CAP = 6;
const RECOMMEND_PROJECT_CAP = 7;
const MAX_CONTEXT_CHUNKS = 8;
const INCLUDED_SECTION_SCORE = 0.92;

/** Match exact section id or numbered suffix (e.g. tech-stack → 4-tech-stack). */
function sectionMatches(sectionId: string, requested: string): boolean {
  return (
    sectionId === requested ||
    sectionId.endsWith(`-${requested}`) ||
    requested.endsWith(`-${sectionId}`)
  );
}

type ScoredChunk = RetrievedChunk & {
  docId: string;
  docType: string;
  sectionId: string;
};

function toRetrieved(chunk: ScoredChunk): RetrievedChunk {
  return {
    id: chunk.id,
    source: chunk.source,
    section: chunk.section,
    text: chunk.text,
    score: chunk.score,
  };
}

function filterChunks(
  chunks: KnowledgeChunkRecord[],
  plan: RetrievalPlan,
): KnowledgeChunkRecord[] {
  let filtered = chunks;

  if (plan.exclude_doc_ids.length > 0) {
    const excluded = new Set(plan.exclude_doc_ids);
    filtered = filtered.filter((chunk) => !excluded.has(chunk.docId));
  }

  if (plan.focus_doc_ids.length > 0) {
    const focused = new Set(plan.focus_doc_ids);
    const inFocus = filtered.filter((chunk) => focused.has(chunk.docId));
    if (inFocus.length > 0) filtered = inFocus;
  }

  return filtered;
}

function fetchListProjectsChunks(
  chunks: KnowledgeChunkRecord[],
): KnowledgeChunkRecord[] {
  const projectDocIds = loadKnowledgeMap()
    .sources.filter((source) => source.type === "project")
    .map((source) => source.docId);

  const results: KnowledgeChunkRecord[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    if (chunk.docId === "projects-overview" && chunk.sectionId === "overview") {
      if (!seen.has(chunk.id)) {
        seen.add(chunk.id);
        results.push(chunk);
      }
    }
  }

  for (const docId of projectDocIds) {
    const atAGlance = chunks
      .filter(
        (chunk) =>
          chunk.docId === docId &&
          chunk.sectionId === "at-a-glance" &&
          !chunk.id.includes("-part-"),
      )
      .concat(
        chunks.filter(
          (chunk) =>
            chunk.docId === docId &&
            chunk.sectionId === "at-a-glance" &&
            chunk.id.includes("-part-"),
        ),
      );

    const pick = atAGlance[0];
    if (pick && !seen.has(pick.id)) {
      seen.add(pick.id);
      results.push(pick);
    }
  }

  return results.slice(0, LIST_PROJECTS_CAP);
}

function pickFirstChunk(
  chunks: KnowledgeChunkRecord[],
  docId: string,
  sectionId: string,
): KnowledgeChunkRecord | undefined {
  const primary = chunks.find(
    (chunk) =>
      chunk.docId === docId &&
      sectionMatches(chunk.sectionId, sectionId) &&
      !chunk.id.includes("-part-"),
  );
  if (primary) return primary;
  return chunks.find(
    (chunk) => chunk.docId === docId && sectionMatches(chunk.sectionId, sectionId),
  );
}

function fetchRecommendProjectChunks(
  chunks: KnowledgeChunkRecord[],
): KnowledgeChunkRecord[] {
  const results: KnowledgeChunkRecord[] = [];
  const seen = new Set<string>();

  const push = (chunk: KnowledgeChunkRecord | undefined) => {
    if (chunk && !seen.has(chunk.id)) {
      seen.add(chunk.id);
      results.push(chunk);
    }
  };

  for (const sectionId of [
    "where-to-start",
    "why-flagship",
    "project-scale",
    "overview",
  ]) {
    push(pickFirstChunk(chunks, "projects-overview", sectionId));
  }

  for (const sectionId of ["at-a-glance", "tech-stack", "problem-purpose"]) {
    push(pickFirstChunk(chunks, "quizconnect", sectionId));
  }

  return results.slice(0, RECOMMEND_PROJECT_CAP);
}

function fetchIncludedSections(
  chunks: KnowledgeChunkRecord[],
  plan: RetrievalPlan,
): ScoredChunk[] {
  if (plan.include_sections.length === 0) return [];

  const sectionSet = new Set(plan.include_sections);
  const matchesIncludedSection = (sectionId: string) =>
    [...sectionSet].some((requested) => sectionMatches(sectionId, requested));
  const focusSet =
    plan.focus_doc_ids.length > 0 ? new Set(plan.focus_doc_ids) : null;
  const excludeSet = new Set(plan.exclude_doc_ids);
  const seen = new Set<string>();
  const results: ScoredChunk[] = [];

  if (
    !focusSet &&
    plan.include_sections.length > 0 &&
    (plan.intent === "follow_up" || plan.intent === "project_detail")
  ) {
    return results;
  }

  for (const chunk of chunks) {
    if (excludeSet.has(chunk.docId)) continue;
    if (focusSet && !focusSet.has(chunk.docId)) continue;
    if (!matchesIncludedSection(chunk.sectionId)) continue;
    if (seen.has(chunk.id)) continue;

    seen.add(chunk.id);
    results.push({
      id: chunk.id,
      source: chunk.source,
      section: chunk.section,
      text: chunk.text,
      docId: chunk.docId,
      docType: chunk.docType,
      sectionId: chunk.sectionId,
      score: INCLUDED_SECTION_SCORE,
    });
  }

  return results;
}

function mergeScoredChunks(
  deterministic: ScoredChunk[],
  semantic: ScoredChunk[],
  cap: number,
): ScoredChunk[] {
  const byId = new Map<string, ScoredChunk>();

  for (const chunk of deterministic) {
    byId.set(chunk.id, chunk);
  }

  for (const chunk of semantic) {
    const existing = byId.get(chunk.id);
    if (!existing || chunk.score > existing.score) {
      byId.set(chunk.id, chunk);
    }
  }

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, cap);
}

function effectiveChunkCap(plan: RetrievalPlan, baseTopK: number): number {
  const queryBoost = Math.min(plan.search_queries.length, 3);
  const sectionBoost = Math.min(plan.include_sections.length, 4);
  return Math.min(MAX_CONTEXT_CHUNKS, baseTopK + queryBoost + Math.floor(sectionBoost / 2));
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

async function searchSemantic(
  corpus: KnowledgeChunkRecord[],
  queries: string[],
  topK: number,
  signal?: AbortSignal,
  shouldStop?: () => boolean | Promise<boolean>,
): Promise<ScoredChunk[]> {
  const uniqueQueries = [...new Set(queries.map((q) => q.trim()).filter(Boolean))];
  if (uniqueQueries.length === 0) return [];

  if (await isCancelled(signal, shouldStop)) {
    throw new DOMException("Aborted", "AbortError");
  }

  const embeddings = await createEmbedding(uniqueQueries, signal);
  const byId = new Map<string, ScoredChunk>();

  for (const queryEmbedding of embeddings) {
    const scored = corpus
      .map((chunk) => ({
        id: chunk.id,
        source: chunk.source,
        section: chunk.section,
        text: chunk.text,
        docId: chunk.docId,
        docType: chunk.docType,
        sectionId: chunk.sectionId,
        score: cosineSimilarity(queryEmbedding.vector, chunk.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    for (const chunk of scored) {
      const existing = byId.get(chunk.id);
      if (!existing || chunk.score > existing.score) {
        byId.set(chunk.id, chunk);
      }
    }
  }

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, topK);
}

function evaluateRefusal(
  _plan: RetrievalPlan,
  _chunks: RetrievedChunk[],
  _maxScore: number,
  _minScore: number,
): boolean {
  // Always let the answer model respond — it handles gaps and off-topic in its own words.
  return false;
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

  const topK = getRagTopK();
  const minScore = getRagMinScore();
  const chunkCap = effectiveChunkCap(plan, topK);
  const corpus = filterChunks(index.chunks, plan);

  let scored: ScoredChunk[] = [];

  if (plan.intent === "list_projects") {
    scored = fetchListProjectsChunks(index.chunks).map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      section: chunk.section,
      text: chunk.text,
      docId: chunk.docId,
      docType: chunk.docType,
      sectionId: chunk.sectionId,
      score: 1,
    }));
  } else if (plan.intent === "recommend_project") {
    scored = fetchRecommendProjectChunks(index.chunks).map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      section: chunk.section,
      text: chunk.text,
      docId: chunk.docId,
      docType: chunk.docType,
      sectionId: chunk.sectionId,
      score: 1,
    }));
  } else if (plan.intent !== "off_topic") {
    const queries =
      plan.search_queries.length > 0 ? plan.search_queries : [userMessage.trim()];
    const included = fetchIncludedSections(index.chunks, plan);
    let semantic: ScoredChunk[] = [];
    try {
      semantic = await searchSemantic(
        corpus,
        queries,
        topK,
        signal,
        shouldStop,
      );
    } catch {
      // Embeddings timed out or failed — proceed with navigator-included sections only.
    }
    scored = mergeScoredChunks(included, semantic, chunkCap);
  }

  const chunks = scored.map(toRetrieved);
  const maxScore = scored[0]?.score ?? 0;
  const shouldRefuse = evaluateRefusal(plan, chunks, maxScore, minScore);

  return {
    chunks: shouldRefuse ? [] : chunks,
    maxScore,
    shouldRefuse,
    systemPrompt: shouldRefuse
      ? ""
      : buildRagSystemPrompt(chunks, userMessage, plan.answer_hint),
    plan,
  };
}

/** @deprecated Use planRetrievalForTurn + retrieveWithPlan from rag-chat-stream */
export async function retrieveKnowledge(
  _history: OpenRouterMessage[],
  currentMessage: string,
): Promise<RetrievalResult> {
  const { fallbackRetrievalPlan } = await import("./navigator-fallback");
  const plan = fallbackRetrievalPlan([], currentMessage);
  return retrieveWithPlan(plan, currentMessage);
}
