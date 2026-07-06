import { createChatCompletion } from "@/lib/openrouter/client";
import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { enrichRetrievalPlan } from "./enrich-retrieval-plan";
import { formatKnowledgeMapForPrompt } from "./format-map-for-prompt";
import { fallbackRetrievalPlan } from "./navigator-fallback";
import { loadKnowledgeMap } from "./load-knowledge-map";
import {
  defaultRetrievalPlan,
  parseRetrievalPlan,
  type RetrievalPlan,
} from "./retrieval-plan";

const ASSISTANT_TRUNCATE = 300;
const NAVIGATOR_TIMEOUT_MS = 8_000;

const NAVIGATOR_SYSTEM = `You are the retrieval navigator for Frederick Aurelio Halim's portfolio chatbot.
Your job is to read the conversation and output a JSON retrieval plan — not an answer to the user.

Be PROACTIVE, not passive:
- Answer the literal question AND pull related context that helps (the "why", not just the "what").
- For "best / biggest / where to start" → intent recommend_project; include projects-overview where-to-start + why-flagship + quizconnect at-a-glance.
- For "other projects besides these four" / "anything else you've built" → intent general; focus projects-overview; include_sections: other-projects-github, overview; answer_hint: four main showcase projects + GitHub https://github.com/FrederickAurelio for smaller repos.
- Anticipate what sections the answer model will need (at-a-glance + tech-stack for project questions, background for bio, etc.).
- Prefer 2–4 diverse search_queries that approach the question from different angles (overview, specifics, synonyms/aliases).
- Set focus_doc_ids when the topic is clear; set include_sections for sections you want pulled even if embedding rank is weak.
- answer_hint: tell the answer model what to emphasize AND what related angle to add (e.g. "recommend QuizConnect + why it stands out + live demo link").
- For vague questions ("tell me about him", "what does he do"), combine about-me + projects-overview via multiple queries.
- For follow-ups ("what stack?", "how does auth work?"), keep focus on the doc discussed in recent turns and add the matching section id.

## Knowledge map
{MAP}

## Intents
- list_projects: user wants a full list ("what projects", "有哪些项目"). search_queries: [].
- recommend_project: user asks what to look at first, biggest, best, flagship, most impressive ("what's your biggest project", "where should I start"). focus: projects-overview + quizconnect. include_sections: where-to-start, why-flagship, at-a-glance, tech-stack. search_queries: [].
- project_detail: user asks about one specific project by name — set focus_doc_ids + include_sections: at-a-glance, tech-stack, problem-purpose.
- bio: about Frederick personally — focus_doc_ids: ["about-me"], include_sections: at-a-glance, background, education.
- experience: jobs, internships — focus_doc_ids: ["work-experience"], include_sections: mufy-at-a-glance, mufy-product.
- pivot_other: user wants a DIFFERENT project than the one just discussed. exclude_doc_ids = doc just discussed. search_queries must NOT lead with excluded project.
- follow_up: same topic, more detail — keep focus_doc_ids from context; add include_sections for the aspect asked (e.g. tech-stack).
- off_topic: ONLY for clearly unrelated requests (weather, recipes, homework, politics, general trivia) — NOT opinions about Frederick, NOT follow-ups, NOT "is he good".
- opinion: subjective / evaluative about Frederick ("is he good?", "what do you think?", "厉害吗") — intent: follow_up, focus about-me, answer_hint: modest honest take from facts + thread.
- general: broad or unclear — use 2–3 search_queries + include at-a-glance sections when comparing projects.

## Output JSON schema (no markdown fences)
{
  "intent": "<one of the intents above>",
  "exclude_doc_ids": ["docId"],
  "focus_doc_ids": ["docId"],
  "include_sections": ["section-id from map, e.g. at-a-glance, tech-stack"],
  "search_queries": ["2-4 standalone search phrases for embedding"],
  "answer_hint": "short hint: what angles to cover in the answer"
}

Rules:
- search_queries: 2–4 items when intent is not list_projects/off_topic. Each phrase should be a complete sentence or rich phrase.
- include_sections: section ids from the map (not file paths). Use when you know the answer needs that slice of a doc.
- exclude_doc_ids / focus_doc_ids: docId from map, max 4 each.
- Output ONLY valid JSON.`;

function truncateAssistant(content: string): string {
  if (content.length <= ASSISTANT_TRUNCATE) return content;
  return `${content.slice(0, ASSISTANT_TRUNCATE)}…`;
}

function lastTurnPairs(
  history: OpenRouterMessage[],
  maxPairs: number,
): OpenRouterMessage[] {
  const pairs: OpenRouterMessage[] = [];
  let i = history.length - 1;

  while (i >= 0 && pairs.length < maxPairs * 2) {
    const message = history[i];
    if (message.role !== "user" && message.role !== "assistant") {
      i -= 1;
      continue;
    }

    if (message.role === "assistant") {
      const userBefore = i > 0 && history[i - 1]?.role === "user" ? history[i - 1] : null;
      if (userBefore) {
        pairs.unshift({
          role: "assistant",
          content: truncateAssistant(message.content),
        });
        pairs.unshift({ role: "user", content: userBefore.content });
        i -= 2;
        continue;
      }
    }

    i -= 1;
  }

  return pairs.slice(-maxPairs * 2);
}

export function buildNavigatorMessages(
  history: OpenRouterMessage[],
  currentMessage: string,
): OpenRouterMessage[] {
  const map = formatKnowledgeMapForPrompt(loadKnowledgeMap());
  const system = NAVIGATOR_SYSTEM.replace("{MAP}", map);
  const priorTurns = lastTurnPairs(history, 2);

  return [
    { role: "system", content: system },
    ...priorTurns,
    {
      role: "user",
      content: `${currentMessage.trim()}\n\nOutput only valid JSON matching the schema.`,
    },
  ];
}

function extractJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    return null;
  }
}

export async function planRetrieval(
  history: OpenRouterMessage[],
  currentMessage: string,
  signal?: AbortSignal,
): Promise<RetrievalPlan> {
  const fallback = () => fallbackRetrievalPlan(history, currentMessage);

  const timeoutController = new AbortController();
  const onAbort = () => timeoutController.abort();
  signal?.addEventListener("abort", onAbort);

  const timeoutId = setTimeout(() => timeoutController.abort(), NAVIGATOR_TIMEOUT_MS);

  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await createChatCompletion({
      messages: buildNavigatorMessages(history, currentMessage),
      signal: combinedSignal,
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 500,
      reasoningEffort: "none",
    });

    if (!response.ok) {
      return enrichRetrievalPlan(fallback(), history, currentMessage);
    }

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return enrichRetrievalPlan(fallback(), history, currentMessage);

    const parsed = parseRetrievalPlan(extractJsonContent(content));
    if (!parsed) return enrichRetrievalPlan(fallback(), history, currentMessage);

    if (parsed.intent === "list_projects" || parsed.intent === "recommend_project" || parsed.intent === "off_topic") {
      return enrichRetrievalPlan(
        defaultRetrievalPlan({
          ...parsed,
          search_queries: [],
        }),
        history,
        currentMessage,
      );
    }

    const withQueries =
      parsed.search_queries.length === 0
        ? defaultRetrievalPlan({
            ...parsed,
            search_queries: [currentMessage.trim()],
          })
        : parsed;

    return enrichRetrievalPlan(withQueries, history, currentMessage);
  } catch {
    return enrichRetrievalPlan(fallback(), history, currentMessage);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}
