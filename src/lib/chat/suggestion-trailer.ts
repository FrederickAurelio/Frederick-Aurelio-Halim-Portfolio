export const SUGGESTION_TRAILER_MARKER = "@@SUGGESTIONS@@";

/** Minimum suffix length before withholding a possible marker prefix. */
const MIN_HOLDBACK_PREFIX_LEN = 2;

export type TrailerFinalizeResult = {
  /** True when @@SUGGESTIONS@@ appeared in the stream (even if JSON was invalid). */
  markerFound: boolean;
  /**
   * Parsed chip labels when markerFound.
   * null only when markerFound is false (no marker in stream).
   */
  suggestions: string[] | null;
  /** Safe visible text withheld during streaming — never a partial marker prefix. */
  flushedTail: string;
};

function isLineAnchoredMarker(text: string, index: number): boolean {
  return index === 0 || text[index - 1] === "\n";
}

/** Last line-anchored @@SUGGESTIONS@@ in the buffer (ignores mid-line mentions). */
export function findTrailerMarkerIndex(text: string): number {
  const marker = SUGGESTION_TRAILER_MARKER;
  let searchEnd = text.length;

  while (searchEnd >= 0) {
    const index = text.lastIndexOf(marker, searchEnd);
    if (index === -1) return -1;
    if (isLineAnchoredMarker(text, index)) return index;
    searchEnd = index - 1;
  }

  return -1;
}

function markerPrefixHoldbackLength(text: string): number {
  const marker = SUGGESTION_TRAILER_MARKER;
  const max = Math.min(text.length, marker.length - 1);

  for (let len = max; len >= MIN_HOLDBACK_PREFIX_LEN; len -= 1) {
    const suffix = text.slice(-len);
    if (marker.startsWith(suffix)) return len;
  }

  return 0;
}

export function isPartialMarkerPrefix(text: string): boolean {
  if (text.length < MIN_HOLDBACK_PREFIX_LEN) return false;
  return SUGGESTION_TRAILER_MARKER.startsWith(text);
}

function safeFlushedTail(holdback: string): string {
  return isPartialMarkerPrefix(holdback) ? "" : holdback;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export function parseSuggestionTrailerPayload(raw: string): string[] | null {
  const text = stripCodeFences(raw.trim());
  if (!text) return [];

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return null;
    const items = parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return items;
  } catch {
    return null;
  }
}

export class SuggestionTrailerFilter {
  private trailerBuffer = "";

  private inTrailer = false;

  private markerFound = false;

  private holdback = "";

  push(delta: string): string {
    if (this.inTrailer) {
      this.trailerBuffer += delta;
      return "";
    }

    const combined = this.holdback + delta;
    this.holdback = "";

    const markerIndex = findTrailerMarkerIndex(combined);
    if (markerIndex !== -1) {
      const visible = combined.slice(0, markerIndex);
      const after = combined.slice(markerIndex + SUGGESTION_TRAILER_MARKER.length);
      this.inTrailer = true;
      this.markerFound = true;
      this.trailerBuffer = after;
      return visible;
    }

    const holdbackLen = markerPrefixHoldbackLength(combined);
    if (holdbackLen > 0) {
      this.holdback = combined.slice(-holdbackLen);
      return combined.slice(0, -holdbackLen);
    }

    return combined;
  }

  finalize(): TrailerFinalizeResult {
    if (!this.markerFound) {
      return {
        markerFound: false,
        suggestions: null,
        flushedTail: safeFlushedTail(this.holdback),
      };
    }

    return {
      markerFound: true,
      suggestions: parseSuggestionTrailerPayload(this.trailerBuffer) ?? [],
      flushedTail: "",
    };
  }
}
