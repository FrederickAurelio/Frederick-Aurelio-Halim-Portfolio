import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { getRagEnrichContextMessages } from "@/lib/openrouter/config";
import { loadKnowledgeMap } from "./load-knowledge-map";
import {
  findDocIdsInText,
  resolvePrimaryDocId,
} from "./resolve-doc-id";
import { applyMultiFocus, resolveFocusDocIds } from "./resolve-multi-focus";
import {
  OTHER_PROJECTS_ANSWER_HINT,
  OTHER_PROJECTS_PATTERN,
  RECOMMEND_PATTERN,
} from "./retrieval-patterns";
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
const ARCHITECTURE_PATTERN =
  /\b(architecture|how (is|does) it work|system design|架构|怎么实现)\b/i;
const CURRENCY_DATA_PATTERN =
  /\b(currency data|exchange rate|fx rate|forex rate|live rate|historical rate|frankfurter|currencybeacon|currency api|where do you get.*(currency|rate|data)|汇率|数据源)\b/i;
const FX_CONTEXT_PATTERN = /\b(fx\s*trad|fxtrad|forex|fxtrade|exchange|frankfurter)\b/i;
const OPINION_PATTERN =
  /\b(what do you think|do you think|is he good|is he really|how good|skilled|capable|talented|厉害|怎么样|你觉得|好不好|真的行吗)\b/i;
const COUNTRY_TRAVEL_PATTERN =
  /\b(abroad|travel|visited|lived in|been to|other nation|哪个国家|其他国家|去过)\b/i;
const CONTACT_PATTERN =
  /\b(contact|email|e-mail|reach you|reach me|get in touch|hire|hiring|linkedin|wechat|微信|联系|邮箱|怎么联系|联系方式)\b/i;
const PORTFOLIO_ABOUT_FREDERICK =
  /\b(frederick|aurelio|林健昌|developer|projects?|portfolio|skills?|jobs?)\b|[\u4e00-\u9fff]/i;

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

  if (intent === "multi_project") {
    base.push("at-a-glance");
    if (STACK_PATTERN.test(message)) {
      base.push("tech-stack");
    }
    if (ARCHITECTURE_PATTERN.test(message)) {
      base.push("architecture");
    }
  }

  if (intent === "multi_doc") {
    base.push("at-a-glance");
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

function addSectionsWhenFocused(
  plan: RetrievalPlan,
  message: string,
): Pick<RetrievalPlan, "include_sections"> {
  const hasFocus = plan.focus_doc_ids.length > 0;
  let include_sections = [...plan.include_sections];

  if (hasFocus && STACK_PATTERN.test(message)) {
    include_sections = unique([...include_sections, "tech-stack"]);
  }

  if (hasFocus && CONTACT_PATTERN.test(message)) {
    include_sections = unique([...include_sections, "contact"]);
  }

  if (
    hasFocus &&
    CURRENCY_DATA_PATTERN.test(message) &&
    (plan.focus_doc_ids.includes("nextjs-fxtrade") || FX_CONTEXT_PATTERN.test(message))
  ) {
    include_sections = unique([
      ...include_sections,
      "data-sources",
      "3-features",
      "4-tech-stack",
    ]);
  }

  include_sections = unique([
    ...include_sections,
    ...sectionsForIntent(plan.intent, message),
  ]);

  return { include_sections };
}

/** After navigator success: widen sections/queries only; never change intent or focus. */
export function enrichRetrievalPlanLight(
  plan: RetrievalPlan,
  currentMessage: string,
  history: OpenRouterMessage[] = [],
): RetrievalPlan {
  const message = currentMessage.trim();

  if (plan.intent === "list_projects" || plan.intent === "off_topic") {
    return { ...plan };
  }

  const context = recentContextText(history);
  const withMulti = applyMultiFocus(plan, message, context);

  if (withMulti.intent === "multi_project" || withMulti.intent === "multi_doc") {
    return withMulti;
  }

  const { include_sections } = addSectionsWhenFocused(withMulti, message);

  const search_queries =
    withMulti.focus_doc_ids.length > 0
      ? expandSearchQueries({ ...withMulti, include_sections }, message, history)
      : withMulti.search_queries;

  const answer_hint =
    withMulti.answer_hint ||
    (include_sections.length > 0
      ? `Use these section types when relevant: ${include_sections.join(", ")}.`
      : "");

  return defaultRetrievalPlan({
    ...withMulti,
    include_sections,
    search_queries,
    answer_hint,
  });
}

/** After fallback only: may fix intent/focus when still empty; never override non-empty focus. */
export function enrichRetrievalPlanHeavy(
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
  const focusWasEmpty = focus_doc_ids.length === 0;

  if (RECOMMEND_PATTERN.test(message) || intent === "recommend_project") {
    intent = "recommend_project";
    if (focusWasEmpty) {
      focus_doc_ids = unique([...focus_doc_ids, "projects-overview", "quizconnect"]);
    }
    answer_hint =
      answer_hint ||
      "Recommend QuizConnect first with repo + live demo. Explain why from documented facts (WebSockets multiplayer, LLM, BullMQ, Docker Compose, GitHub Actions deploy to VPS). Offer a second project only if their interest is clear.";
  }

  if (OTHER_PROJECTS_PATTERN.test(message)) {
    if (focusWasEmpty) {
      focus_doc_ids = unique([...focus_doc_ids, "projects-overview"]);
    }
    include_sections = unique([
      ...include_sections,
      "other-projects-github",
      "overview",
    ]);
    answer_hint = answer_hint || OTHER_PROJECTS_ANSWER_HINT;
  }

  if (OPINION_PATTERN.test(message)) {
    intent = "follow_up";
    if (focus_doc_ids.length === 0) focus_doc_ids = ["about-me"];
    include_sections = unique([...include_sections, "at-a-glance", "background"]);
    answer_hint =
      answer_hint ||
      "Give a brief, modest opinion on skills/strengths from documented projects and stack. Use what was already said in the thread.";
  }

  if (COUNTRY_TRAVEL_PATTERN.test(message)) {
    intent = "bio";
    if (focus_doc_ids.length === 0) {
      focus_doc_ids = unique([...focus_doc_ids, "about-me"]);
    }
    include_sections = unique([
      ...include_sections,
      "at-a-glance",
      "education",
      "languages",
      "background",
    ]);
  }

  if (CURRENCY_DATA_PATTERN.test(message) && FX_CONTEXT_PATTERN.test(message)) {
    if (focus_doc_ids.length === 0) {
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
    focus_doc_ids.length === 0 &&
    (intent === "project_detail" || intent === "follow_up" || intent === "general")
  ) {
    focus_doc_ids = resolveFocusDocIds(message, context, 4);
    if (focus_doc_ids.length >= 2) {
      intent = "multi_project";
    } else if (focus_doc_ids.length > 0 && intent === "general") {
      intent = "project_detail";
    }
  }

  if (intent === "bio" && focus_doc_ids.length === 0) {
    focus_doc_ids = ["about-me"];
  }

  if (intent === "experience" && focus_doc_ids.length === 0) {
    focus_doc_ids = ["work-experience"];
  }

  if (intent === "experience") {
    answer_hint =
      answer_hint ||
      "Describe the Mufy AI role (Frontend Developer, May 2025 – June 2026, Hangzhou). Explain what the product is and include the live link https://chat.mufy.ai/. Mention concrete surfaces or stack from context — do not invent metrics.";
  }

  if (CONTACT_PATTERN.test(message)) {
    intent = intent === "general" ? "bio" : intent;
    if (focus_doc_ids.length === 0) {
      focus_doc_ids = unique([...focus_doc_ids, "about-me"]);
    }
    include_sections = unique([...include_sections, "contact"]);
    answer_hint =
      answer_hint ||
      "Contact only from context: email frederick.ah88@gmail.com, GitHub https://github.com/FrederickAurelio, WeChat QR on this page. No LinkedIn URL documented. Visitor is already on the portfolio — do not link to a portfolio website or invent domains.";
  }

  if (COMPARE_PATTERN.test(message)) {
    const compared = findDocIdsInText(`${message}\n${context}`);
    if (compared.length >= 2) {
      focus_doc_ids = unique([...focus_doc_ids, ...compared]).slice(0, 4);
    }
  }

  let workingPlan = defaultRetrievalPlan({
    ...plan,
    intent,
    focus_doc_ids,
    include_sections,
    answer_hint,
  });

  workingPlan = applyMultiFocus(workingPlan, message, context);

  if (workingPlan.intent === "multi_project" || workingPlan.intent === "multi_doc") {
    return workingPlan;
  }

  intent = workingPlan.intent;
  focus_doc_ids = workingPlan.focus_doc_ids;
  include_sections = workingPlan.include_sections;
  answer_hint = workingPlan.answer_hint;

  const sectionMerge = addSectionsWhenFocused(
    { ...plan, intent, focus_doc_ids, include_sections },
    message,
  );
  include_sections = sectionMerge.include_sections;

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
    { ...plan, intent, focus_doc_ids, include_sections },
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

/** @deprecated Use enrichRetrievalPlanHeavy via planRetrievalForTurn */
export function enrichRetrievalPlan(
  plan: RetrievalPlan,
  history: OpenRouterMessage[],
  currentMessage: string,
): RetrievalPlan {
  return enrichRetrievalPlanHeavy(plan, history, currentMessage);
}
