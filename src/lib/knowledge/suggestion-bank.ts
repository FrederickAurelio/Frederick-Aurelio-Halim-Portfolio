import type { RetrievalIntent } from "./retrieval-plan";

export type SuggestionKind = "cold_start" | "follow_up" | "pivot" | "global";

export type SuggestionCandidate = {
  id: string;
  text: { en: string; ch: string };
  docId?: string;
  sectionId?: string;
  intent?: RetrievalIntent;
  kind: SuggestionKind;
};

/**
 * Curated suggestion bank. Picker shows max 3 per turn — quality over volume.
 * Each entry should be something a real visitor might tap, not an interview checklist.
 */
export const SUGGESTION_BANK: SuggestionCandidate[] = [
  // ─── Cold start (4) — only 3 shown; fixed priority in pick-suggestions ─
  {
    id: "cold-start-project",
    kind: "cold_start",
    intent: "recommend_project",
    docId: "projects-overview",
    sectionId: "where-to-start",
    text: {
      en: "What should I look at first?",
      ch: "我应该先看哪个项目？",
    },
  },
  {
    id: "cold-stack",
    kind: "cold_start",
    text: { en: "What's your tech stack?", ch: "你的技术栈是什么？" },
  },
  {
    id: "cold-who",
    kind: "cold_start",
    text: { en: "Who are you?", ch: "你是谁？" },
  },
  {
    id: "cold-quizconnect",
    kind: "cold_start",
    docId: "quizconnect",
    sectionId: "at-a-glance",
    text: { en: "Tell me about QuizConnect", ch: "介绍一下 QuizConnect" },
  },

  // ─── About me (5) ─────────────────────────────────────────────────────
  {
    id: "bio-background",
    kind: "follow_up",
    docId: "about-me",
    intent: "bio",
    sectionId: "background",
    text: { en: "Tell me about your background", ch: "介绍一下你的背景" },
  },
  {
    id: "bio-education",
    kind: "follow_up",
    docId: "about-me",
    intent: "bio",
    sectionId: "education",
    text: { en: "Where did you study?", ch: "你在哪里读的大学？" },
  },
  {
    id: "bio-languages",
    kind: "follow_up",
    docId: "about-me",
    intent: "bio",
    sectionId: "languages",
    text: { en: "What languages do you speak?", ch: "你会哪些语言？" },
  },
  {
    id: "bio-interests-ai",
    kind: "follow_up",
    docId: "about-me",
    sectionId: "interests",
    text: {
      en: "What are you exploring lately?",
      ch: "你最近在研究什么？",
    },
  },
  {
    id: "bio-open-roles",
    kind: "follow_up",
    docId: "about-me",
    sectionId: "at-a-glance",
    text: {
      en: "Are you open to new roles?",
      ch: "你现在在找工作吗？",
    },
  },

  // ─── Projects catalog (5) ─────────────────────────────────────────────
  {
    id: "catalog-list",
    kind: "follow_up",
    docId: "projects-overview",
    intent: "list_projects",
    sectionId: "overview",
    text: { en: "List all your projects", ch: "列出你所有的项目" },
  },
  {
    id: "catalog-flagship",
    kind: "follow_up",
    docId: "projects-overview",
    intent: "recommend_project",
    sectionId: "why-flagship",
    text: {
      en: "Why is QuizConnect your flagship?",
      ch: "为什么 QuizConnect 是主打项目？",
    },
  },
  {
    id: "catalog-live-demos",
    kind: "follow_up",
    docId: "projects-overview",
    sectionId: "overview",
    text: {
      en: "Which projects have live demos?",
      ch: "哪些项目有线上演示？",
    },
  },
  {
    id: "catalog-github",
    kind: "follow_up",
    docId: "projects-overview",
    sectionId: "other-projects-github",
    text: {
      en: "Any other projects on GitHub?",
      ch: "GitHub 上还有其他项目吗？",
    },
  },
  {
    id: "catalog-second-fx",
    kind: "follow_up",
    docId: "projects-overview",
    sectionId: "where-to-start",
    text: {
      en: "What should I look at after QuizConnect?",
      ch: "看完 QuizConnect 还能看什么？",
    },
  },

  // ─── QuizConnect (5) — flagship depth ───────────────────────────────
  {
    id: "qc-stack",
    kind: "follow_up",
    docId: "quizconnect",
    sectionId: "tech-stack",
    text: {
      en: "What stack is QuizConnect built with?",
      ch: "QuizConnect 用了什么技术栈？",
    },
  },
  {
    id: "qc-websockets",
    kind: "follow_up",
    docId: "quizconnect",
    sectionId: "5-architecture",
    text: {
      en: "How does real-time multiplayer work?",
      ch: "实时多人对战怎么实现的？",
    },
  },
  {
    id: "qc-deploy",
    kind: "follow_up",
    docId: "quizconnect",
    sectionId: "5-architecture",
    text: {
      en: "How is QuizConnect deployed?",
      ch: "QuizConnect 怎么部署的？",
    },
  },
  {
    id: "qc-llm",
    kind: "follow_up",
    docId: "quizconnect",
    sectionId: "3-features",
    text: {
      en: "How does AI quiz generation work?",
      ch: "AI 生成题库是怎么做的？",
    },
  },
  {
    id: "qc-hard",
    kind: "follow_up",
    docId: "quizconnect",
    sectionId: "7-interesting-hard-problems-solved",
    text: {
      en: "What was the hardest part of QuizConnect?",
      ch: "QuizConnect 最难的技术点是什么？",
    },
  },

  // ─── FXTrade (4) ──────────────────────────────────────────────────────
  {
    id: "fx-data-sources",
    kind: "follow_up",
    docId: "nextjs-fxtrade",
    sectionId: "data-sources",
    text: {
      en: "Where does FXTrade get currency data?",
      ch: "FXTrade 的汇率数据从哪来？",
    },
  },
  {
    id: "fx-stack",
    kind: "follow_up",
    docId: "nextjs-fxtrade",
    sectionId: "tech-stack",
    text: { en: "What's the FXTrade tech stack?", ch: "FXTrade 用了什么技术？" },
  },
  {
    id: "fx-charts",
    kind: "follow_up",
    docId: "nextjs-fxtrade",
    sectionId: "3-features",
    text: {
      en: "How do the FX charts work?",
      ch: "汇率图表是怎么实现的？",
    },
  },
  {
    id: "fx-trading-validation",
    kind: "follow_up",
    docId: "nextjs-fxtrade",
    sectionId: "7-interesting-hard-problems-solved",
    text: {
      en: "How are trades validated server-side?",
      ch: "交易怎么在服务端校验？",
    },
  },

  // ─── Memories (3) ─────────────────────────────────────────────────────
  {
    id: "mem-konva",
    kind: "follow_up",
    docId: "memories",
    sectionId: "7-interesting-hard-problems-solved",
    text: {
      en: "How does the Konva canvas editor work?",
      ch: "Konva 画布编辑器怎么实现的？",
    },
  },
  {
    id: "mem-privacy",
    kind: "follow_up",
    docId: "memories",
    sectionId: "3-features",
    text: {
      en: "How does sharing and privacy work?",
      ch: "分享和隐私权限怎么做的？",
    },
  },
  {
    id: "mem-deploy",
    kind: "follow_up",
    docId: "memories",
    sectionId: "at-a-glance",
    text: {
      en: "Is Memories deployed anywhere?",
      ch: "Memories 有部署上线吗？",
    },
  },

  // ─── Promis (2) ───────────────────────────────────────────────────────
  {
    id: "promis-seo",
    kind: "follow_up",
    docId: "promis-conveyor-chain",
    sectionId: "6-notable-technical-decisions-trade-offs",
    text: {
      en: "How did you handle SEO on Promis?",
      ch: "Promis 的 SEO 怎么做的？",
    },
  },
  {
    id: "promis-whatsapp",
    kind: "follow_up",
    docId: "promis-conveyor-chain",
    sectionId: "3-features",
    text: {
      en: "How does lead capture work on Promis?",
      ch: "Promis 怎么收集客户咨询？",
    },
  },

  // ─── Work experience (4) ──────────────────────────────────────────────
  {
    id: "exp-mufy",
    kind: "follow_up",
    docId: "work-experience",
    sectionId: "mufy-at-a-glance",
    text: { en: "What did you do at Mufy?", ch: "你在 Mufy 做了什么？" },
  },
  {
    id: "exp-product",
    kind: "follow_up",
    docId: "work-experience",
    sectionId: "mufy-product",
    text: { en: "What is Mufy AI?", ch: "Mufy AI 是什么产品？" },
  },
  {
    id: "exp-features",
    kind: "follow_up",
    docId: "work-experience",
    sectionId: "mufy-features",
    text: {
      en: "Which features did you build at Mufy?",
      ch: "你在 Mufy 做了哪些功能？",
    },
  },
  {
    id: "exp-stack",
    kind: "follow_up",
    docId: "work-experience",
    sectionId: "mufy-stack",
    text: {
      en: "What stack did you use at Mufy?",
      ch: "在 Mufy 用了什么技术栈？",
    },
  },

  // ─── Pivot (4) — one clean prompt per other project ───────────────────
  {
    id: "pivot-quizconnect",
    kind: "pivot",
    docId: "quizconnect",
    text: { en: "Tell me about QuizConnect", ch: "介绍一下 QuizConnect" },
  },
  {
    id: "pivot-fxtrade",
    kind: "pivot",
    docId: "nextjs-fxtrade",
    text: { en: "Tell me about FXTrade", ch: "介绍一下 FXTrade" },
  },
  {
    id: "pivot-memories",
    kind: "pivot",
    docId: "memories",
    text: { en: "Tell me about Memories", ch: "介绍一下 Memories" },
  },
  {
    id: "pivot-promis",
    kind: "pivot",
    docId: "promis-conveyor-chain",
    text: { en: "Tell me about Promis", ch: "介绍一下 Promis" },
  },

  // ─── Global (3) — off-topic redirects ─────────────────────────────────
  {
    id: "global-projects",
    kind: "global",
    text: { en: "What projects have you built?", ch: "你做过哪些项目？" },
  },
  {
    id: "global-experience",
    kind: "global",
    text: { en: "What's your work experience?", ch: "你的工作经历是什么？" },
  },
  {
    id: "global-stack",
    kind: "global",
    text: { en: "What technologies do you use?", ch: "你常用哪些技术？" },
  },
];

export const SUGGESTION_BANK_SIZE = SUGGESTION_BANK.length;
