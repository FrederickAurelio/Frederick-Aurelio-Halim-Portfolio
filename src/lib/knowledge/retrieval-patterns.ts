/** Shared regex + hints for navigator fallback and heavy enrich — keep in sync. */

export const RECOMMEND_PATTERN =
  /\b(biggest project|best project|flagship|look up first|look at first|where to start|where should (i|you) start|what to check|which project should i|which project should you|recommend a project|most impressive project|main project to|最值得|推荐哪个|哪个项目先看|先看哪个项目)\b/i;

export const OTHER_PROJECTS_PATTERN =
  /\b(other projects?|besides (these|those|that|the four|the 4)|any more projects?|more projects?|outside (these|the four)|anything else you('ve| have) built|other repos?|other than (these|those)|还有什么项目|还有其他|别的项目|除了这四个)\b|\bbesides?\s+(that|those|the)\s+(four|4)\b/i;

export const OTHER_PROJECTS_ANSWER_HINT =
  "Four portfolio projects are the main showcase. Also name Bookling (React + Django REST, book-sharing uni collab, no live demo — https://github.com/FrederickAurelio/Bookling) and The Wild Oasis (Jonas React course hotel-admin tutorial, https://github.com/FrederickAurelio/Realworld-React-Project/tree/main/the-wild-oasis). Point to https://github.com/FrederickAurelio for the full list. Be honest: Wild Oasis is course work; Bookling is older collab, repo only.";
