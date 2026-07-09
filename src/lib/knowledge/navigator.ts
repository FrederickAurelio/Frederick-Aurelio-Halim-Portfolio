import { createChatCompletion } from "@/lib/openrouter/client";
import {
  getRagNavigatorMaxAssistantChars,
  getRagNavigatorTurnPairs,
} from "@/lib/openrouter/config";
import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { formatKnowledgeMapForPrompt } from "./format-map-for-prompt";
import { loadKnowledgeMap } from "./load-knowledge-map";
import {
  formatSessionTopicForPrompt,
  type SessionRoutingState,
} from "./session-routing-state";
import {
  parseRetrievalPlan,
  type RetrievalPlan,
} from "./retrieval-plan";

const NAVIGATOR_SYSTEM = `You are the retrieval navigator for Frederick Aurelio Halim's portfolio chatbot.
Your job is to read the conversation and output a JSON retrieval plan — not an answer to the user.

You plan **multiple focused search queries** (like separate Google searches), one per topic the user asked about.
Retrieval will embed each query and merge the best chunks. Do NOT mash several topics into one query.

## How to plan
- Identify every distinct topic in the user message (education, work, a project, contact, flagship, other GitHub work, etc.).
- Emit 1–4 items in topics[]. Each item needs:
  - label: short tag (e.g. education, quizconnect-stack, other-projects)
  - query: a rich standalone search phrase for embedding (complete sentence or dense phrase)
  - preferDocId: optional docId from the knowledge map when the topic clearly maps to one doc
- prefer_doc_ids: optional list of docIds to soft-focus (max 4). Usually the same docs as preferDocId values.
- exclude_doc_ids: only when the user wants a *different* project than the one just discussed.
- answer_hint: short note for the answer model — what to cover and in what order.
- off_topic: true ONLY for clearly unrelated asks (weather, recipes, homework, politics, general trivia). Then topics must be [].

## Multi-topic (critical)
If the user asks about 2+ areas in one message, output **one topics[] entry per area** with its own query.
Examples:
- education + work → two topics (about-me education query, work-experience Mufy query)
- QuizConnect + Memories stacks → two topics
- timeline + biggest project → education/work topics PLUS a QuizConnect / where-to-start topic

## Product guidance (encode in topics + answer_hint, not as special intents)
- "best / biggest / where to start" alone → topics that search QuizConnect + why it stands out / where-to-start (preferDocId quizconnect and/or projects-overview). answer_hint: recommend QuizConnect with repo + live demo from notes.
- "other projects / not listed / besides these four" → topics aimed at other-projects-github, Bookling, Wild Oasis (preferDocId projects-overview). answer_hint: name Bookling with https://github.com/FrederickAurelio/Bookling.
- Single named project → 1–2 topics (at-a-glance / aspect asked), preferDocId that project.
- Vague follow-up with session primaryDocId set → queries about that doc; set preferDocId to primaryDocId.
- Contact / email / WeChat → preferDocId about-me, query about contact links.
- Opinion about Frederick → about-me background + documented work; modest take in answer_hint.

## Knowledge map
{MAP}

{SESSION_TOPIC}

## Output JSON schema (no markdown fences)
{
  "topics": [
    { "label": "education", "query": "Frederick university education Zhejiang China", "preferDocId": "about-me" }
  ],
  "answer_hint": "short hint for the answer model",
  "prefer_doc_ids": ["about-me"],
  "exclude_doc_ids": [],
  "off_topic": false
}

Rules:
- topics: 1–4 when not off_topic. Each query must be useful alone for embedding.
- preferDocId / prefer_doc_ids / exclude_doc_ids: only docIds from the map.
- Output ONLY valid JSON.`;

function truncateAssistant(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars)}…`;
}

function lastTurnPairs(
  history: OpenRouterMessage[],
  maxPairs: number,
  maxAssistantChars: number,
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
          content: truncateAssistant(message.content, maxAssistantChars),
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
  routingState: SessionRoutingState,
): OpenRouterMessage[] {
  const map = formatKnowledgeMapForPrompt(loadKnowledgeMap());
  const sessionTopic = formatSessionTopicForPrompt(routingState);
  const maxAssistantChars = getRagNavigatorMaxAssistantChars();
  const system = NAVIGATOR_SYSTEM.replace("{MAP}", map).replace(
    "{SESSION_TOPIC}",
    sessionTopic,
  );
  const priorTurns = lastTurnPairs(
    history,
    getRagNavigatorTurnPairs(),
    maxAssistantChars,
  );

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

export type NavigatorLlmResult =
  | { ok: true; plan: RetrievalPlan }
  | { ok: false };

export async function callNavigatorLlm(
  history: OpenRouterMessage[],
  currentMessage: string,
  routingState: SessionRoutingState,
  signal?: AbortSignal,
): Promise<NavigatorLlmResult> {
  try {
    const response = await createChatCompletion({
      messages: buildNavigatorMessages(history, currentMessage, routingState),
      signal,
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 500,
      reasoningEffort: "none",
    });

    if (!response.ok) return { ok: false };

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return { ok: false };

    const parsed = parseRetrievalPlan(
      extractJsonContent(content),
      loadKnowledgeMap(),
    );
    if (!parsed) return { ok: false };

    return { ok: true, plan: parsed };
  } catch {
    return { ok: false };
  }
}
