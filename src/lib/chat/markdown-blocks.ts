const FENCE_PATTERN = /^```/;
const LIST_LINE_PATTERN = /^(\s*)([-*+]|\d+\.)\s+/;
const TABLE_LINE_PATTERN = /^\s*\|/;
const BLOCKQUOTE_LINE_PATTERN = /^>\s?/;
const HEADING_LINE_PATTERN = /^#{1,6}\s+/;
const HR_LINE_PATTERN = /^(\*{3,}|-{3,}|_{3,})\s*$/;

function isListLine(line: string): boolean {
  return LIST_LINE_PATTERN.test(line);
}

function isTableLine(line: string): boolean {
  return TABLE_LINE_PATTERN.test(line);
}

function isBlockquoteLine(line: string): boolean {
  return BLOCKQUOTE_LINE_PATTERN.test(line);
}

function isHeadingLine(line: string): boolean {
  return HEADING_LINE_PATTERN.test(line);
}

function isHrLine(line: string): boolean {
  return HR_LINE_PATTERN.test(line.trim());
}

function shouldStartNewBlock(prevLine: string, line: string): boolean {
  const prevIsList = isListLine(prevLine);
  const prevIsTable = isTableLine(prevLine);
  const prevIsQuote = isBlockquoteLine(prevLine);
  const currIsList = isListLine(line);
  const currIsTable = isTableLine(line);
  const currIsQuote = isBlockquoteLine(line);

  if (isHeadingLine(line) || isHrLine(line)) return true;
  if (prevIsList && !currIsList) return true;
  if (prevIsTable && !currIsTable) return true;
  if (prevIsQuote && !currIsQuote) return true;
  if (!prevIsList && !prevIsTable && !prevIsQuote && (currIsList || currIsTable || currIsQuote)) {
    return true;
  }

  return false;
}

export function splitMarkdownBlocks(content: string): string[] {
  if (!content.trim()) return [];

  const lines = content.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;

  const flush = () => {
    if (current.length === 0) return;
    blocks.push(current.join("\n"));
    current = [];
  };

  for (const line of lines) {
    if (FENCE_PATTERN.test(line)) {
      current.push(line);
      inFence = !inFence;
      if (!inFence) flush();
      continue;
    }

    if (inFence) {
      current.push(line);
      continue;
    }

    if (line.trim() === "") {
      flush();
      continue;
    }

    if (current.length > 0) {
      const prevLine = current[current.length - 1];
      if (shouldStartNewBlock(prevLine, line)) {
        flush();
      }
    }

    current.push(line);

    if (isHrLine(line)) {
      flush();
    }
  }

  flush();
  return blocks.length > 0 ? blocks : [content];
}

export function repairStreamingMarkdown(content: string): string {
  if (!content) return content;

  let result = content;

  const fenceCount = (result.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) {
    result += "\n```";
  }

  const boldCount = (result.match(/\*\*/g) ?? []).length;
  if (boldCount % 2 !== 0) {
    result += "**";
  }

  const strikeCount = (result.match(/~~/g) ?? []).length;
  if (strikeCount % 2 !== 0) {
    result += "~~";
  }

  return result;
}
