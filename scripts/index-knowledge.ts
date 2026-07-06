import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { chunkMarkdownCorpus } from "../src/lib/knowledge/chunk-markdown";
import { buildKnowledgeMap } from "../src/lib/knowledge/build-knowledge-map";
import type { KnowledgeIndex } from "../src/lib/knowledge/types";

const DOCS_DIR = path.join(process.cwd(), "docs");
const OUTPUT_PATH = path.join(process.cwd(), "src/lib/knowledge/index.json");
const MAP_OUTPUT_PATH = path.join(process.cwd(), "src/lib/knowledge/knowledge-map.json");
const DEFAULT_EMBEDDING_MODEL = "qwen/qwen3-embedding-8b";
const BATCH_SIZE = 20;

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional for local indexing
  }
}

async function embedBatch(
  apiKey: string,
  model: string,
  inputs: string[],
): Promise<number[][]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: inputs }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Embedding batch failed (${response.status}): ${text}`);
  }

  const body = (await response.json()) as {
    data: { embedding: number[]; index: number }[];
  };

  return body.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

async function main(): Promise<void> {
  loadEnvLocal();

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is required to build the knowledge index.");
    process.exit(1);
  }

  const embeddingModel =
    process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;

  const files = readdirSync(DOCS_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const source = `docs/${name}`;
      return {
        source,
        content: readFileSync(path.join(DOCS_DIR, name), "utf8"),
      };
    });

  const drafts = chunkMarkdownCorpus(files);
  console.log(`Chunked ${files.length} docs into ${drafts.length} chunks.`);

  const knowledgeMap = buildKnowledgeMap(files);
  writeFileSync(MAP_OUTPUT_PATH, `${JSON.stringify(knowledgeMap, null, 2)}\n`, "utf8");
  console.log(`Wrote ${MAP_OUTPUT_PATH}`);

  const chunks: KnowledgeIndex["chunks"] = [];

  for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
    const batch = drafts.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatch(
      apiKey,
      embeddingModel,
      batch.map((draft) => draft.body),
    );

    for (let j = 0; j < batch.length; j += 1) {
      chunks.push({
        id: batch[j].id,
        source: batch[j].source,
        section: batch[j].section,
        text: batch[j].body,
        vector: vectors[j],
        docId: batch[j].docId,
        docType: batch[j].docType,
        sectionId: batch[j].sectionId,
      });
    }

    console.log(`Embedded ${Math.min(i + BATCH_SIZE, drafts.length)}/${drafts.length}`);
  }

  const index: KnowledgeIndex = {
    version: 1,
    embeddingModel,
    createdAt: new Date().toISOString(),
    chunks,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(index)}\n`, "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

void main();
