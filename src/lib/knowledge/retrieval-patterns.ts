/** Shared regex + hints for navigator fallback and heavy enrich — keep in sync. */

export const RECOMMEND_PATTERN =
  /\b(biggest project|best project|flagship|look up first|look at first|where to start|where should (i|you) start|what to check|which project should i|which project should you|recommend a project|most impressive project|main project to|最值得|推荐哪个|哪个项目先看|先看哪个项目)\b/i;

export const OTHER_PROJECTS_PATTERN =
  /\b(other projects?|besides (these|those|that|the four|the 4)|any more projects?|more projects?|outside (these|the four)|anything else you('ve| have) built|other repos?|other than (these|those)|not (listed|shown|featured|on (this|the) (page|site|portfolio))|还有什么项目|还有其他|别的项目|除了这四个)\b|\bbesides?\s+(that|those|the)\s+(four|4)\b/i;

export const OTHER_PROJECTS_ANSWER_HINT =
  "Four portfolio projects are the main showcase on this site. Name Bookling and Wild Oasis when asked about other work. When you mention Bookling, ALWAYS print its repo URL: https://github.com/FrederickAurelio/Bookling (no live demo — do not say 'repo only' without the link). Wild Oasis: repo https://github.com/FrederickAurelio/Realworld-React-Project/tree/main/the-wild-oasis, live https://the-wild-oasis-two-murex.vercel.app/ (course tutorial). Point to https://github.com/FrederickAurelio for everything else. Be honest: Wild Oasis is course work; Bookling is older uni collab.";

export const MULTI_PROJECT_ANSWER_HINT =
  "Cover EACH project in focus_doc_ids separately (bullets or short paragraphs). Use only context for each — if one project's section is missing, say so for that project only; do not invent stacks or features.";

/** Base hint — pair with buildMultiDocAnswerHint(docIds) for per-doc coverage. */
export const MULTI_DOC_ANSWER_HINT =
  "multi_doc: the user asked about 2+ portfolio areas in one message. Cover EACH focus doc separately (bullets or short paragraphs). Use only context per doc — if one section is missing, say so for that doc only. Chronological questions: order by documented dates. Do not invent facts.";
