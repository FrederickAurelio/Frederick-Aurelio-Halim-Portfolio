type StreamDeltas = {
  reasoning: string;
  content: string;
};

/** Coalesce rapid stream deltas into one flush per animation frame. */
export function createStreamBatcher(onFlush: (deltas: StreamDeltas) => void) {
  let pendingReasoning = "";
  let pendingContent = "";
  let rafId: number | null = null;

  const flush = () => {
    rafId = null;
    const reasoning = pendingReasoning;
    const content = pendingContent;
    pendingReasoning = "";
    pendingContent = "";

    if (!reasoning && !content) return;
    onFlush({ reasoning, content });
  };

  const schedule = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(flush);
  };

  return {
    pushThinking(delta: string) {
      pendingReasoning += delta;
      schedule();
    },
    pushContent(delta: string) {
      pendingContent += delta;
      schedule();
    },
    flushNow() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      flush();
    },
  };
}
