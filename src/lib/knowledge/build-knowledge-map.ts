import { chunkMarkdownCorpus, parseFrontmatter } from "./chunk-markdown";
import type { KnowledgeMap, KnowledgeMapSource } from "./types";

export function buildKnowledgeMap(
  files: { source: string; content: string }[],
): KnowledgeMap {
  const drafts = chunkMarkdownCorpus(files);
  const byDoc = new Map<string, KnowledgeMapSource>();

  for (const file of files) {
    const { frontmatter } = parseFrontmatter(file.content);
    const docId =
      frontmatter.id ??
      file.source.replace(/^docs\//, "").replace(/\.md$/, "");
    if (!byDoc.has(docId)) {
      byDoc.set(docId, {
        docId,
        type: frontmatter.type ?? "general",
        title: frontmatter.title ?? docId,
        aliases: frontmatter.aliases ?? [],
        sourceFile: file.source,
        sections: [],
      });
    }
  }

  for (const draft of drafts) {
    const entry = byDoc.get(draft.docId);
    if (!entry) continue;
    if (!entry.sections.includes(draft.sectionId)) {
      entry.sections.push(draft.sectionId);
    }
  }

  const sources = [...byDoc.values()].sort((a, b) =>
    a.docId.localeCompare(b.docId),
  );

  return { version: 1, sources };
}
