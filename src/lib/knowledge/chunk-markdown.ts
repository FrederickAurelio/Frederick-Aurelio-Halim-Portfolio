import type { RagFrontmatter } from "./types";

export type MarkdownChunkDraft = {
  id: string;
  source: string;
  section: string;
  body: string;
  docId: string;
  docType: string;
  sectionId: string;
};

const EXCLUDED_HEADING =
  /open questions|unverified|to confirm|evidence & confidence/i;
const MAX_CHARS = 1600;
const MIN_CHARS = 320;
const OVERLAP_CHARS = 160;

export function parseFrontmatter(content: string): {
  frontmatter: RagFrontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yaml = match[1];
  const body = match[2];
  const frontmatter: RagFrontmatter = {};

  const idMatch = yaml.match(/^\s*id:\s*(.+)$/m);
  if (idMatch) frontmatter.id = idMatch[1].trim();

  const typeMatch = yaml.match(/^\s*type:\s*(.+)$/m);
  if (typeMatch) frontmatter.type = typeMatch[1].trim();

  const titleMatch = yaml.match(/^\s*title:\s*(.+)$/m);
  if (titleMatch) frontmatter.title = titleMatch[1].trim().replace(/^["']|["']$/g, "");

  const aliasesMatch = yaml.match(/^\s*aliases:\s*\[([^\]]*)\]/m);
  if (aliasesMatch) {
    frontmatter.aliases = aliasesMatch[1]
      .split(",")
      .map((value) => value.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  return { frontmatter, body };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

function shouldExcludeSection(heading: string, sectionBody: string): boolean {
  if (EXCLUDED_HEADING.test(heading)) return true;
  return /<!--\s*rag-exclude\s*-->/.test(sectionBody.split("\n").slice(0, 3).join("\n"));
}

function splitLongSection(
  text: string,
  baseId: string,
): { id: string; text: string }[] {
  const paragraphs = text.split(/\n\n+/).filter((part) => part.trim());
  if (paragraphs.length <= 1 && text.length <= MAX_CHARS) {
    return [{ id: baseId, text }];
  }

  const parts: { id: string; text: string }[] = [];
  let current = "";
  let partIndex = 0;

  const flush = () => {
    const trimmed = current.trim();
    if (!trimmed) return;
    const suffix = partIndex === 0 ? "" : `-part-${partIndex + 1}`;
    parts.push({ id: `${baseId}${suffix}`, text: trimmed });
    partIndex += 1;
    current = "";
  };

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > MAX_CHARS && current) {
      flush();
      current = paragraph;
      continue;
    }

    if (paragraph.length > MAX_CHARS) {
      flush();
      let offset = 0;
      while (offset < paragraph.length) {
        const slice = paragraph.slice(offset, offset + MAX_CHARS);
        const suffix = partIndex === 0 ? "" : `-part-${partIndex + 1}`;
        parts.push({ id: `${baseId}${suffix}`, text: slice.trim() });
        partIndex += 1;
        offset += MAX_CHARS - OVERLAP_CHARS;
      }
      current = "";
      continue;
    }

    current = candidate;
  }

  flush();
  return parts.length > 0 ? parts : [{ id: baseId, text }];
}

function buildBreadcrumb(source: string, sectionPath: string[]): string {
  const file = source.replace(/^docs\//, "");
  return `[Source: ${file} | ${sectionPath.join(" > ")}]`;
}

type SectionNode = {
  level: number;
  heading: string;
  lines: string[];
};

function normalizeLine(line: string): string {
  return line.replace(/\r$/, "");
}

function parseSections(body: string): SectionNode[] {
  const lines = body.split("\n");
  const sections: SectionNode[] = [];
  let current: SectionNode | null = null;

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = {
        level: headingMatch[1].length,
        heading: headingMatch[2].trim(),
        lines: [],
      };
      continue;
    }

    if (!current) {
      if (line.trim()) {
        current = { level: 2, heading: "Introduction", lines: [line] };
      }
      continue;
    }

    current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

export function chunkMarkdownFile(
  source: string,
  rawContent: string,
): MarkdownChunkDraft[] {
  const { frontmatter, body } = parseFrontmatter(rawContent);
  const docId = frontmatter.id ?? slugify(source);
  const docType = frontmatter.type ?? "general";
  const sections = parseSections(body);
  const breadcrumbs: string[] = [];
  const drafts: MarkdownChunkDraft[] = [];

  for (const section of sections) {
    while (breadcrumbs.length >= section.level - 1) {
      breadcrumbs.pop();
    }
    breadcrumbs.push(section.heading);

    const sectionBody = section.lines.join("\n").trim();
    if (!sectionBody && section.heading === "Introduction") continue;
    if (shouldExcludeSection(section.heading, sectionBody)) continue;

    const sectionSlug = slugify(section.heading);
    const ragSectionMatch = sectionBody.match(/<!--\s*rag-section:\s*([^>]+)\s*-->/);
    const sectionId = ragSectionMatch?.[1].trim() ?? sectionSlug;
    const baseId = `${docId}#${sectionId}`;

    const aliasLine =
      frontmatter.aliases && frontmatter.aliases.length > 0
        ? `Also known as: ${frontmatter.aliases.join(", ")}.\n\n`
        : "";

    const opener =
      frontmatter.title && section.heading.includes("At a glance")
        ? `${frontmatter.title} — ${section.heading}.\n\n`
        : "";

    const coreText = `${opener}${aliasLine}${sectionBody}`.trim();
    const parts = splitLongSection(coreText, baseId);

    for (const part of parts) {
      if (part.text.length < MIN_CHARS && parts.length > 1) {
        // keep small tail chunks if they carry unique content
      }

      const prefix = buildBreadcrumb(source, breadcrumbs);
      drafts.push({
        id: part.id,
        source,
        section: breadcrumbs.join(" > "),
        body: `${prefix}\n\n${part.text}`,
        docId,
        docType,
        sectionId,
      });
    }
  }

  return drafts;
}

export function chunkMarkdownCorpus(
  files: { source: string; content: string }[],
): MarkdownChunkDraft[] {
  return files.flatMap((file) => chunkMarkdownFile(file.source, file.content));
}

export { estimateTokens, MAX_CHARS };
