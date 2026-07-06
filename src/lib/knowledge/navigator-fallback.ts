import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { buildRetrievalQuery } from "./build-query";
import { loadKnowledgeMap } from "./load-knowledge-map";
import {
  defaultRetrievalPlan,
  type RetrievalPlan,
} from "./retrieval-plan";

const OFF_TOPIC_PATTERN =
  /\b(weather|temperature|forecast|recipe|cook|bitcoin price|homework|solve this math)\b|今天天气|天气预报|帮我写作业/i;

const OPINION_PATTERN =
  /\b(what do you think|do you think|is he good|is he really|how good|skilled|capable|talented|厉害|怎么样|你觉得|好不好|真的行吗)\b/i;

const COUNTRY_TRAVEL_PATTERN =
  /\b(country|countries|abroad|travel|visited|lived in|been to|other nation|哪个国家|其他国家|去过)\b/i;

const RECOMMEND_PATTERN =
  /\b(biggest|best|flagship|look up first|look at first|start with|which project should|recommend|most impressive|main project|where to start|what to check|最值得|最好|先看|推荐|哪个项目)\b/i;

const OTHER_PROJECTS_PATTERN =
  /\b(other projects?|besides (these|those|that|the four|the 4)|any more projects?|more projects?|outside (these|the four)|anything else you('ve| have) built|other repos?|other than (these|those)|还有什么项目|还有其他|别的项目|除了这四个)\b|\bbesides?\s+(that|those|the)\s+(four|4)\b/i;

const LIST_PROJECTS_PATTERN =
  /what projects?|which projects?|list (all )?projects?|projects does (he|frederick) have|有哪些项目|有什么项目|他有哪些项目|做过什么项目/i;

const PIVOT_PATTERN =
  /\b(other|another|besides|else|different)\b|其他|别的|还有|另一个/i;

function findDocIdFromText(text: string): string | null {
  const map = loadKnowledgeMap();
  const lower = text.toLowerCase();

  for (const source of map.sources) {
    if (lower.includes(source.docId.toLowerCase())) return source.docId;
    if (lower.includes(source.title.toLowerCase())) return source.docId;
    for (const alias of source.aliases) {
      if (lower.includes(alias.toLowerCase())) return source.docId;
    }
  }

  return null;
}

function recentUserTexts(history: OpenRouterMessage[], limit: number): string[] {
  return history
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean)
    .slice(-limit);
}

function recentAssistantText(history: OpenRouterMessage[]): string {
  const assistants = history.filter((message) => message.role === "assistant");
  return assistants.at(-1)?.content.trim() ?? "";
}

export function fallbackRetrievalPlan(
  history: OpenRouterMessage[],
  currentMessage: string,
): RetrievalPlan {
  const current = currentMessage.trim();

  if (OFF_TOPIC_PATTERN.test(current)) {
    return defaultRetrievalPlan({ intent: "off_topic" });
  }

  if (LIST_PROJECTS_PATTERN.test(current) && !RECOMMEND_PATTERN.test(current)) {
    return defaultRetrievalPlan({ intent: "list_projects" });
  }

  if (RECOMMEND_PATTERN.test(current)) {
    return defaultRetrievalPlan({
      intent: "recommend_project",
      focus_doc_ids: ["projects-overview", "quizconnect"],
      include_sections: [
        "where-to-start",
        "why-flagship",
        "project-scale",
        "at-a-glance",
        "tech-stack",
      ],
      answer_hint:
        "Recommend QuizConnect as the first project to explore. Give repo + live demo links. Explain why using facts from why-flagship (WebSockets, LLM, BullMQ, Docker, CI/CD auto-deploy to VPS). Mention one alternative if relevant.",
    });
  }

  if (OTHER_PROJECTS_PATTERN.test(current)) {
    return defaultRetrievalPlan({
      intent: "general",
      focus_doc_ids: ["projects-overview"],
      include_sections: ["other-projects-github", "overview"],
      search_queries: [],
      answer_hint:
        "The four portfolio projects are the main showcase. Smaller uni/learning repos are on GitHub but not portfolio-ready. Link https://github.com/FrederickAurelio. Offer to go deeper on the four or match their stack interest.",
    });
  }

  if (OPINION_PATTERN.test(current)) {
    return defaultRetrievalPlan({
      intent: "follow_up",
      focus_doc_ids: ["about-me"],
      include_sections: ["at-a-glance", "background"],
      search_queries: [
        "Frederick Aurelio Halim skills projects full-stack developer",
        current,
      ],
      answer_hint:
        "Brief modest take on skills/strengths from documented work. Use the conversation — don't refuse.",
    });
  }

  if (COUNTRY_TRAVEL_PATTERN.test(current)) {
    return defaultRetrievalPlan({
      intent: "bio",
      focus_doc_ids: ["about-me"],
      include_sections: ["at-a-glance", "education", "languages", "background"],
      search_queries: [
        "Frederick Aurelio Halim countries lived Indonesia China Hangzhou",
        current,
      ],
    });
  }

  if (PIVOT_PATTERN.test(current) && !OTHER_PROJECTS_PATTERN.test(current)) {
    const assistantText = recentAssistantText(history);
    const excludeFromAssistant = findDocIdFromText(assistantText);
    const priorUsers = recentUserTexts(history, 2);
    const excludeFromUser = priorUsers
      .map(findDocIdFromText)
      .find((id): id is string => Boolean(id));

    const exclude = excludeFromAssistant ?? excludeFromUser;
    if (exclude) {
      return defaultRetrievalPlan({
        intent: "pivot_other",
        exclude_doc_ids: [exclude],
        search_queries: [
          "Frederick Aurelio Halim portfolio projects overview",
          "Memories Nextjs-FXTrade Promis project at a glance",
        ],
        include_sections: ["at-a-glance"],
      });
    }
  }

  const query = buildRetrievalQuery(history, current);
  const docIds = findDocIdFromText(current) ?? findDocIdFromText(recentAssistantText(history));
  return defaultRetrievalPlan({
    intent: docIds ? "project_detail" : "general",
    focus_doc_ids: docIds ? [docIds] : [],
    include_sections: docIds ? ["at-a-glance", "tech-stack"] : ["at-a-glance"],
    search_queries: docIds
      ? [query, `Frederick Halim ${docIds} project details`]
      : [query, "Frederick Aurelio Halim portfolio projects and background"],
  });
}
