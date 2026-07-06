import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { getRagEnrichContextMessages } from "@/lib/openrouter/config";
import { loadKnowledgeMap } from "./load-knowledge-map";
import {
  findDocIdsInText,
  resolveFocusDocIds,
  resolvePrimaryDocId,
} from "./resolve-doc-id";
import { defaultRetrievalPlan, type RetrievalIntent, type RetrievalPlan } from "./retrieval-plan";

function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function recentContextText(history: OpenRouterMessage[]): string {
  return history
    .slice(-getRagEnrichContextMessages())
    .map((message) => message.content)
    .join("\n");
}

const COMPARE_PATTERN = /\b(vs\.?|versus|compare|compared|difference between|哪个更好|对比|比较)\b/i;
const STACK_PATTERN = /\b(stack|tech|technology|framework|libraries|用什么|技术栈)\b/i;
const CURRENCY_DATA_PATTERN =
  /\b(currency data|exchange rate|fx rate|forex rate|live rate|historical rate|frankfurter|currencybeacon|currency api|where do you get.*(currency|rate|data)|汇率|数据源)\b/i;
const OPINION_PATTERN =
  /\b(what do you think|do you think|is he good|is he really|how good|skilled|capable|talented|厉害|怎么样|你觉得|好不好|真的行吗)\b/i;
const COUNTRY_TRAVEL_PATTERN =
  /\b(country|countries|abroad|travel|visited|lived in|been to|other nation|哪个国家|其他国家|去过)\b/i;
const RECOMMEND_PATTERN =
  /\b(biggest|best|flagship|look up first|look at first|start with|which project should|recommend|most impressive|main project|where to start|what to check|最值得|最好|先看|推荐|哪个项目)\b/i;
const OTHER_PROJECTS_PATTERN =
  /\b(other projects?|besides (these|those|that|the four|the 4)|any more projects?|more projects?|outside (these|the four)|anything else you('ve| have) built|other repos?|other than (these|those)|还有什么项目|还有其他|别的项目|除了这四个)\b|\bbesides?\s+(that|those|the)\s+(four|4)\b/i;
const PORTFOLIO_ABOUT_FREDERICK =
  /\b(he|him|his|you|your|frederick|aurelio|林健昌|developer|project|stack|skill|work|job|china|country|good|think)\b|[\u4e00-\u9fff]/i;

function sectionsForIntent(intent: RetrievalIntent, message: string): string[] {
  const base: string[] = [];

  if (intent === "project_detail" || intent === "follow_up") {
    base.push("at-a-glance");
    if (intent === "project_detail") {
      base.push("tech-stack", "architecture", "problem-purpose");
    }
    if (STACK_PATTERN.test(message)) {
      base.push("tech-stack");
    }
    if (CURRENCY_DATA_PATTERN.test(message)) {
      base.push("3-features", "4-tech-stack", "data-sources");
    }
  }

  if (intent === "bio" || COUNTRY_TRAVEL_PATTERN.test(message)) {
    base.push("at-a-glance", "background", "education", "languages", "contact");
  }

  if (intent === "experience") {
    base.push("mufy-at-a-glance", "mufy-product", "mufy-responsibilities");
  }

  if (intent === "pivot_other") {
    base.push("at-a-glance");
  }

  if (intent === "recommend_project") {
    base.push(
      "where-to-start",
      "why-flagship",
      "project-scale",
      "overview",
      "at-a-glance",
      "tech-stack",
    );
  }

  if (intent === "general" && OTHER_PROJECTS_PATTERN.test(message)) {
    base.push("other-projects-github", "overview");
  }

  if (intent === "general" && COMPARE_PATTERN.test(message)) {
    base.push("at-a-glance");
  }

  return base;
}

function expandSearchQueries(
  plan: RetrievalPlan,
  currentMessage: string,
  history: OpenRouterMessage[],
): string[] {
  const queries = [...plan.search_queries];
  const context = recentContextText(history);

  if (plan.intent === "pivot_other") {
    queries.push(
      "Frederick Aurelio Halim other portfolio projects besides current topic",
      "projects overview other projects GitHub FrederickAurelio",
      "Memories Nextjs-FXTrade Promis Conveyor Chain project summary",
    );
  }

  if (plan.intent === "bio" && queries.length < 2) {
    queries.push("Frederick Aurelio Halim background education full-stack developer Indonesia");
  }

  if (plan.intent === "experience" && queries.length < 2) {
    queries.push("Frederick Aurelio Halim work experience internship Mufy");
  }

  if (plan.intent === "project_detail" || plan.intent === "follow_up") {
    const docId = plan.focus_doc_ids[0];
    if (docId && queries.length < 2) {
      const source = loadKnowledgeMap().sources.find((s) => s.docId === docId);
      if (source) {
        queries.push(`${source.title} ${currentMessage} Frederick Halim portfolio`);
      }
    }
    if (CURRENCY_DATA_PATTERN.test(currentMessage) && docId === "nextjs-fxtrade") {
      queries.push(
        "Nextjs-FXTrade Frankfurter API historical exchange rates CurrencyBeacon live rates",
      );
    }
  }

  if (plan.intent === "general") {
    if (queries.length < 2) {
      queries.push(`Frederick Aurelio Halim portfolio ${currentMessage}`);
    }
    if (queries.length < 3 && !queries.some((q) => /overview|projects/i.test(q))) {
      queries.push("Frederick portfolio projects and work overview");
    }
  }

  if (COMPARE_PATTERN.test(currentMessage)) {
    const docIds = findDocIdsInText(`${currentMessage}\n${context}`);
    for (const docId of docIds.slice(0, 2)) {
      const source = loadKnowledgeMap().sources.find((s) => s.docId === docId);
      if (source) {
        queries.push(`${source.title} at a glance features tech stack`);
      }
    }
  }

  return unique(queries).slice(0, 4);
}

/** Make navigator output proactive: widen sections, queries, and focus before retrieval. */
export function enrichRetrievalPlan(
  plan: RetrievalPlan,
  history: OpenRouterMessage[],
  currentMessage: string,
): RetrievalPlan {
  const message = currentMessage.trim();
  const context = recentContextText(history);

  let intent = plan.intent;

  if (
    intent === "off_topic" &&
    (PORTFOLIO_ABOUT_FREDERICK.test(message) || PORTFOLIO_ABOUT_FREDERICK.test(context))
  ) {
    intent = OPINION_PATTERN.test(message)
      ? "follow_up"
      : COUNTRY_TRAVEL_PATTERN.test(message)
        ? "bio"
        : "general";
  }

  if (intent === "list_projects") {
    return { ...plan, intent };
  }

  let focus_doc_ids = [...plan.focus_doc_ids];
  let include_sections = [...plan.include_sections];
  let answer_hint = plan.answer_hint;

  if (RECOMMEND_PATTERN.test(message) || intent === "recommend_project") {
    intent = "recommend_project";
    focus_doc_ids = unique([...focus_doc_ids, "projects-overview", "quizconnect"]);
    answer_hint =
      answer_hint ||
      "Recommend QuizConnect first with repo + live demo. Explain why from documented facts (WebSockets multiplayer, LLM, BullMQ, Docker Compose, GitHub Actions deploy to VPS). Offer a second project only if their interest is clear.";
  }

  if (OTHER_PROJECTS_PATTERN.test(message)) {
    focus_doc_ids = unique([...focus_doc_ids, "projects-overview"]);
    include_sections = unique([
      ...include_sections,
      "other-projects-github",
      "overview",
    ]);
    answer_hint =
      answer_hint ||
      "Say the four portfolio projects are the main showcase. Smaller uni/learning repos exist on GitHub but aren't portfolio-ready. Link https://github.com/FrederickAurelio. Offer to dive into the four or match their stack interest.";
  }

  if (OPINION_PATTERN.test(message)) {
    intent = "follow_up";
    if (focus_doc_ids.length === 0) focus_doc_ids = ["about-me"];
    include_sections = unique([
      ...include_sections,
      "at-a-glance",
      "background",
    ]);
    answer_hint =
      answer_hint ||
      "Give a brief, modest opinion on skills/strengths from documented projects and stack. Use what was already said in the thread.";
  }

  if (COUNTRY_TRAVEL_PATTERN.test(message)) {
    intent = "bio";
    focus_doc_ids = unique([...focus_doc_ids, "about-me"]);
    include_sections = unique([
      ...include_sections,
      "at-a-glance",
      "education",
      "languages",
      "background",
    ]);
  }

  if (CURRENCY_DATA_PATTERN.test(message)) {
    const fxFocus =
      resolvePrimaryDocId(message, context) === "nextjs-fxtrade" ||
      focus_doc_ids.includes("nextjs-fxtrade") ||
      /fx\s*trad|fxtrad|forex|fxtrade/i.test(message);
    if (fxFocus || focus_doc_ids.length === 0) {
      intent = intent === "general" ? "project_detail" : intent;
      focus_doc_ids = unique([...focus_doc_ids, "nextjs-fxtrade"]);
      include_sections = unique([
        ...include_sections,
        "data-sources",
        "3-features",
        "4-tech-stack",
      ]);
      answer_hint =
        answer_hint ||
        "Answer from context: historical rates from Frankfurter API (api.frankfurter.app, base CNY); live rates from CurrencyBeacon, polled every 60s via /api/currency and /api/latestcurrency. Do not guess other APIs.";
    }
  }

  if (intent === "off_topic") {
    return defaultRetrievalPlan({
      ...plan,
      intent,
      answer_hint:
        "Politely say this chat is for your work/portfolio, in your own words — suggest a project or skills question.",
    });
  }

  if (
    (intent === "project_detail" || intent === "follow_up" || intent === "general") &&
    focus_doc_ids.length === 0
  ) {
    focus_doc_ids = resolveFocusDocIds(message, context, 2);
    if (focus_doc_ids.length > 0 && intent === "general") {
      intent = "project_detail";
    }
  } else if (
    (intent === "project_detail" || intent === "follow_up") &&
    focus_doc_ids.length > 0
  ) {
    const resolved = resolvePrimaryDocId(message, context);
    if (resolved && !focus_doc_ids.includes(resolved)) {
      focus_doc_ids = [resolved, ...focus_doc_ids].slice(0, 2);
    }
  }

  if (intent === "bio" && focus_doc_ids.length === 0) {
    focus_doc_ids = ["about-me"];
  }

  if (intent === "experience" && focus_doc_ids.length === 0) {
    focus_doc_ids = ["work-experience"];
  }

  if (COMPARE_PATTERN.test(message)) {
    const compared = findDocIdsInText(`${message}\n${context}`);
    if (compared.length >= 2) {
      focus_doc_ids = unique([...focus_doc_ids, ...compared]).slice(0, 4);
    }
  }

  include_sections = unique([
    ...include_sections,
    ...sectionsForIntent(intent, message),
  ]);

  if (intent === "recommend_project") {
    return defaultRetrievalPlan({
      ...plan,
      intent,
      focus_doc_ids,
      include_sections,
      search_queries: [],
      answer_hint:
        answer_hint ||
        "Recommend QuizConnect first with repo + live demo. Explain why from documented facts (WebSockets multiplayer, LLM, BullMQ, Docker Compose, GitHub Actions deploy to VPS). Offer a second project only if their interest is clear.",
    });
  }

  const search_queries = expandSearchQueries(
    { ...plan, intent, focus_doc_ids },
    message,
    history,
  );

  const finalHint =
    answer_hint ||
    (include_sections.length > 0
      ? `Use these section types when relevant: ${include_sections.join(", ")}.`
      : "");

  return defaultRetrievalPlan({
    ...plan,
    intent,
    focus_doc_ids,
    include_sections,
    search_queries,
    answer_hint: finalHint,
  });
}
