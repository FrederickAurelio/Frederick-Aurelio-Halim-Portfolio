export type KnowledgeChunkRecord = {
  id: string;
  source: string;
  section: string;
  text: string;
  vector: number[];
  docId: string;
  docType: string;
  sectionId: string;
};

export type KnowledgeIndex = {
  version: number;
  embeddingModel: string;
  createdAt: string;
  chunks: KnowledgeChunkRecord[];
};

export type RetrievedChunk = {
  id: string;
  source: string;
  section: string;
  text: string;
  score: number;
};

export type RagFrontmatter = {
  id?: string;
  type?: string;
  title?: string;
  aliases?: string[];
};

export type KnowledgeMapSource = {
  docId: string;
  type: string;
  title: string;
  aliases: string[];
  sourceFile: string;
  sections: string[];
};

export type KnowledgeMap = {
  version: number;
  sources: KnowledgeMapSource[];
};
