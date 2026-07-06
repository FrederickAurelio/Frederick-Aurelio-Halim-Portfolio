import type { KnowledgeMap } from "./types";

export function formatKnowledgeMapForPrompt(map: KnowledgeMap): string {
  const lines = [
    "| docId | type | title | aliases | key sections |",
    "|-------|------|-------|---------|--------------|",
  ];

  for (const source of map.sources) {
    const aliases =
      source.aliases.length > 0 ? source.aliases.slice(0, 4).join(", ") : "—";
    const sections = source.sections.slice(0, 8).join(", ") || "—";
    lines.push(
      `| ${source.docId} | ${source.type} | ${source.title} | ${aliases} | ${sections} |`,
    );
  }

  return lines.join("\n");
}
