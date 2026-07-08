export type Language = "en" | "ch";

export type LocalizedText<T = string> = Record<Language, T>;

export type NavbarItem = {
  text: string;
  id: string;
};

export type HeroContent = {
  to: string;
  navbar: NavbarItem[];
  hero: {
    name: string;
    title: string;
    subTitle: [string, string];
    button: string;
  };
};

export type ProjectItem = {
  img: string;
  refMore: string;
  refSite: string;
  title: LocalizedText;
  desc: LocalizedText;  vpn?: boolean;
};

export type StackItem = {
  name: string;
  path: string;
};

export type DetailItem = {
  color: string;
  spotlight: string;
  logo: string;
  github: string;
  dark?: boolean;
  list: LocalizedText<string[]>;
  tags: string[];
};

export const hero: Record<Language, HeroContent> = {
  en: {
    to: "中文",
    navbar: [
      { text: "About", id: "about" },
      { text: "Tech Stack", id: "stack" },
      { text: "Experience", id: "experience" },
      { text: "Projects", id: "projects" },
      { text: "Project Details", id: "details" },
      { text: "Contact", id: "contact" },
    ],
    hero: {
      name: "Frederick Aurelio Halim",
      title: "Frontend Developer",
      subTitle: [
        "I build and deploy full-stack web applications with ",
        ".",
      ],
      button: "Get Started",
    },
  },
  ch: {
    to: "English",
    navbar: [
      { text: "关于", id: "about" },
      { text: "技术栈", id: "stack" },
      { text: "工作经历", id: "experience" },
      { text: "项目", id: "projects" },
      { text: "项目详情", id: "details" },
      { text: "联系", id: "contact" },
    ],
    hero: {
      name: "林健昌",
      title: "前端开发者",
      subTitle: ["我用 ", " 构建并部署全栈 Web 应用。"],
      button: "开始",
    },
  },
};

export type AboutContent = {
  heading: LocalizedText;
  greeting: LocalizedText;
  status: LocalizedText;
  paragraphs: LocalizedText<string[]>;
  focus: string[];
};

export const about: AboutContent = {
  heading: { en: "About Me", ch: "关于我" },
  greeting: { en: "Hey, I'm Frederick 👋", ch: "嗨，我是 Frederick 👋" },
  status: {
    en: "Open to frontend / full-stack roles",
    ch: "正在寻找前端 / 全栈的工作机会",
  },
  paragraphs: {
    en: [
      "I'm a frontend developer who builds and deploys full-stack web apps, mostly with React, Next.js, and Express. I'm comfortable across the whole stack. I build the interface, wire up the API and auth, then ship it.",
      "I picked up coding on my own before studying it properly. I graduated from Zhejiang University of Science and Technology in 2026 with a B.Eng. with Honours. What I enjoy most is solving problems. I work out the logic, then watch it click into place.",
      "Recently, I've been exploring AI agents and learning how tool calling and agent loops work. Away from the keyboard, I game a fair bit. Right now I'm looking for a team where I can build real products and keep growing as a developer.",
    ],
    ch: [
      "我是一名前端开发者，也做全栈，主要用 React、Next.js 和 Express。整条链路我都能上手。写界面、接口和认证，然后部署上线。",
      "我一开始是自学写代码，后来才正经学了这一行。2026 年我从浙江科技大学毕业，拿到工学荣誉学士学位。我最喜欢的就是解决问题。把逻辑想清楚，然后看着它跑起来。",
      "最近我在探索 AI agent，学习工具调用和 agent loop 是怎么运作的。不写代码的时候，我挺爱打游戏。现在我想找一个团队，能一起做真实的产品，也让我不断成长。",
    ],
  },
  focus: ["React", "Next.js", "Express", "TypeScript", "MongoDB", "Supabase"],
};

export type ExperienceItem = {
  role: LocalizedText;
  company: LocalizedText;
  url?: string;
  location: LocalizedText;
  period: LocalizedText;
  summary: LocalizedText;
  bullets: LocalizedText<string[]>;
  stack: string[];
};

export type ExperienceContent = {
  heading: LocalizedText;
  jobs: ExperienceItem[];
};

export const experience: ExperienceContent = {
  heading: { en: "Experience", ch: "工作经历" },
  jobs: [
    {
      role: { en: "Frontend Developer", ch: "前端开发" },
      company: { en: "Mufy AI", ch: "Mufy AI" },
      url: "https://chat.mufy.ai/",
      location: { en: "Hangzhou, China · On-site", ch: "中国杭州 · 现场办公" },
      period: { en: "May 2025 to June 2026", ch: "2025年5月 至 2026年6月" },
      summary: {
        en: "Mufy is an AI roleplay chat app with hundreds of characters across genres like romance, fantasy, and games. You can chat with ones other people made, or create your own for others to play with.",
        ch: "Mufy 是一款 AI 角色扮演聊天应用，有上百个角色，覆盖恋爱、奇幻、游戏等各种题材。你可以和别人做的角色聊天，也可以自己创建角色让别人来玩。",
      },
      bullets: {
        en: [
          "Built new features and pages for the web app as the product kept growing.",
          "Made reusable hooks and components so we weren't rewriting the same code every time.",
          "Tested the app and fixed bugs as they came up, and cleaned up logic that had gotten messy over time.",
          "Used AI coding tools as part of the daily workflow to ship features faster.",
          "Worked day to day with the designers, backend, and the other frontend devs to get things shipped.",
        ],
        ch: [
          "给 Web 应用做新功能和新页面，跟着产品一起迭代。",
          "把常用的逻辑抽成可复用的 hooks 和组件，避免每次都重写同样的代码。",
          "边做边测试应用、随时修 bug，也整理写乱了的旧逻辑。",
          "把 AI 编程工具用在日常开发里，更快地把功能做出来上线。",
          "日常和设计、后端以及其他前端同事紧密协作，一起推进交付。",
        ],
      },
      stack: [
        "React",
        "TypeScript",
        "Vite",
        "Zustand",
        "React Query",
        "Tailwind",
        "React Hook Form",
      ],
    },
  ],
};

export const projects = {
  note: {
    en: "Note: Users in China need a VPN to access the website.",
    ch: "注意：中国大陆用户需要使用VPN才能访问该网站。",
  },
  link: {
    en: ["Learn more", "Check Live Site"],
    ch: ["了解更多", "查看网站"],
  },
  projects: [
    {
      img: "/quizconnect.png",
      refMore: "#quizconnect",
      refSite: "http://120.26.45.50:3221/",
      title: {
        en: "QuizConnect (Web App) - React / Express",
        ch: "QuizConnect（网页应用）- React / Express",
      },
      desc: {
        en: "A real-time multiplayer quiz game. Build a quiz (or let AI draft one from a PDF), host a live round with a game code, and everyone answers in sync on a shared leaderboard. React frontend, Express + Socket.IO + Redis backend.",
        ch: "一个实时多人答题游戏。自己出题（也可以让 AI 根据 PDF 自动生成），用房间码开一局，所有人同步答题、共用一个实时排行榜。前端 React，后端 Express + Socket.IO + Redis。",
      },
    },
    {
      img: "/ss-memories.png",
      refMore: "#memories",
      refSite: "https://github.com/FrederickAurelio/Memories",
      title: {
        en: "Memories (Web App) - Nextjs / Expressjs",
        ch: "Memories（网页应用）- Nextjs / Expressjs",
      },
      desc: {
        en: "A digital scrapbook app. Arrange photos, text, shapes, and freehand drawings on a Canva style canvas editor, then save and share your pages. Privacy settings and friends decide who sees what. Full stack Next.js and Express.",
        ch: "一个数字剪贴簿应用。在类似 Canva 的画布编辑器里摆放照片、文字、形状和涂鸦，保存并分享作品，谁能看由隐私设置和好友关系决定。全栈 Next.js 和 Express。",
      },
    },
    {
      img: "/fxtrade.png",
      refMore: "#fxtrade",
      refSite: "https://nextjs-fx-trade.vercel.app/",
      title: {
        en: "FXTrade (Web App) - Nextjs / Supabase",
        ch: "FXTrade（网页应用）- Nextjs / Supabase",
      },
      vpn: true,
      desc: {
        en: "A forex trading simulator. Sign up, get ¥100,000 in fake money, and practice buying and selling currencies against live and historical rates. Balance and price checks run on the server so trades can't be faked. Next.js and Supabase.",
        ch: "一个外汇交易模拟器。注册后获得 ¥100,000 虚拟资金，用真实的实时和历史汇率练习买卖货币。余额和价格校验都放在服务端，避免作弊。Next.js 和 Supabase。",
      },
    },
    {
      img: "/promis.jpg",
      refMore: "#promis",
      refSite: "https://promis-web.vercel.app/",
      title: {
        en: "Promis Conveyor Chain (Company Site) - Nextjs",
        ch: "Promis Conveyor Chain（公司官网）- Nextjs",
      },
      vpn: true,
      desc: {
        en: "A company site for an Indonesian conveyor-chain supplier. Built the product catalog, animated sections, and a full SEO setup (structured data, sitemap, Open Graph), with WhatsApp links for quote requests. Next.js, Tailwind, and Framer Motion.",
        ch: "为一家印尼输送链供应商做的公司官网。做了产品目录、带动效的页面板块，以及完整的 SEO（结构化数据、站点地图、Open Graph），询价通过 WhatsApp 直达。Next.js、Tailwind 和 Framer Motion。",
      },
    },
  ] satisfies ProjectItem[],
};

export const stacks: StackItem[] = [
  { name: "JavaScript", path: "/js.svg" },
  { name: "Typescript", path: "/typescript.svg" },
  { name: "Nextjs", path: "/nextjs.svg" },
  { name: "react", path: "/react.svg" },
  { name: "tailwindCSS", path: "/tailwindcss.svg" },
  { name: "Vite", path: "/vite.svg" },
  { name: "ExpressJs", path: "/express-109.svg" },
  { name: "Supabase", path: "/supabase.svg" },
  { name: "React Query", path: "/react-router.svg" },
  { name: "React Router", path: "/query.svg" },
  { name: "redux", path: "/redux.svg" },
  { name: "Axios", path: "/axios.svg" },
];

export const details = {
  more: {
    en: "More projects on my GitHub",
    ch: "更多项目都在我的 GitHub",
  },
  moreLink: "https://github.com/FrederickAurelio",
  details: [
    {
      color: "border-violet-500/60 bg-[#1e1b2e]",
      spotlight: "rgb(164, 143, 255, 0.35)",
      logo: "quizconnect",
      dark: true,
      github: "https://github.com/FrederickAurelio/QuizConnect",
      list: {
        en: [
          "Built a real time multiplayer quiz game (React, Express, Socket.IO) where a host opens a room, players join with a code, and everyone answers in sync on a shared leaderboard.",
          "Made the server authoritative over each round and ran the question timers as Redis backed BullMQ jobs, so a live game keeps going even if the server restarts mid match.",
          "Added AI features through the OpenRouter API: draft a quiz from an uploaded PDF, explain any answer, and generate a session summary.",
          "Containerized the whole stack with Docker (server, MongoDB, Redis, Nginx) and set up GitHub Actions to build and deploy to a VPS on every push to main.",
        ],
        ch: [
          "做了一个实时多人答题游戏（React、Express、Socket.IO）：主持人开房，玩家用房间码加入，所有人同步答题，共用一个实时排行榜。",
          "让服务端主导每一局，并把每题的计时放到基于 Redis 的 BullMQ 任务里，这样即使服务器中途重启，正在进行的对局也不会中断。",
          "通过 OpenRouter API 加了几个 AI 功能：根据上传的 PDF 生成草稿题库、解释任意一道题，以及生成整局的分析总结。",
          "用 Docker 把整套服务容器化（服务端、MongoDB、Redis、Nginx），并用 GitHub Actions 做到每次推送到 main 就自动构建并部署到服务器。",
        ],
      },
      tags: [
        "React",
        "Express",
        "WebSockets (Socket.IO)",
        "Redis",
        "BullMQ",
        "MongoDB",
        "Docker",
        "CI/CD",
        "LLM APIs",
      ],
    },
    {
      color: "border-neutral-800 bg-neutral-200",
      spotlight: "rgb(41, 37, 36, 0.3)",
      logo: "memories",
      github: "https://github.com/FrederickAurelio/Memories",
      list: {
        en: [
          "Built a digital scrapbook web app (Next.js, Express, MongoDB) where you arrange photos, text, shapes, and drawings on a canvas, then share the page with friends.",
          "Wrote the canvas editor from scratch with React Konva, including drag, resize, layers, and undo and redo.",
          "Kept private photos private by serving every image through an ownership check, so only the owner and their friends can load it.",
          "Set up accounts with GitHub OAuth and server side sessions; friend requests and a couple of screens are still in progress.",
        ],
        ch: [
          "做了一个数字剪贴簿应用（Next.js、Express、MongoDB）：在画布上摆放照片、文字、形状和涂鸦，然后把作品分享给好友。",
          "用 React Konva 从零写了整个画布编辑器，包括拖动、缩放、图层，以及撤销和重做。",
          "为了保护隐私，每张图片都要先过一遍归属校验，私密照片只有作者和好友才能加载。",
          "用 GitHub OAuth 和服务端会话做了账号系统；好友申请和几个页面还在做。",
        ],
      },
      tags: [
        "Next.js",
        "Express",
        "MongoDB",
        "React Konva",
        "GitHub OAuth",
        "Session Auth",
      ],
    },
    {
      color: "border-emerald-700 bg-emerald-50",
      spotlight: "rgb(4, 120, 87, 0.3)",
      logo: "fxtrade",
      github: "https://github.com/FrederickAurelio/Nextjs-FXTrade",
      list: {
        en: [
          "Built a forex trading simulator (Next.js, Supabase) where users get ¥100,000 of virtual money and trade currencies against live and historical rates.",
          "Priced and validated every trade on the server and locked writes down with Supabase row level security, so a user can't edit their own balance from the browser.",
          "Polled live exchange rates on an interval with React Query and cached historical rates to cut repeat API calls.",
          "Rebuilt an older React project of mine on Next.js and moved the backend from LeanCloud to Supabase.",
        ],
        ch: [
          "做了一个外汇交易模拟器（Next.js、Supabase）：用户拿到 ¥100,000 虚拟资金，用真实的实时和历史汇率买卖货币。",
          "每一笔交易都在服务端定价和校验，并用 Supabase 行级安全锁住写入权限，用户没法在浏览器里改自己的余额。",
          "用 React Query 定时轮询实时汇率，并缓存历史汇率，减少重复的 API 请求。",
          "把我之前一个 React 项目在 Next.js 上重做，并把后端从 LeanCloud 换成了 Supabase。",
        ],
      },
      tags: [
        "Next.js",
        "Supabase",
        "Row Level Security",
        "React Query",
        "GSAP",
        "OAuth",
      ],
    },
    {
      color: "border-stone-800 bg-stone-200",
      spotlight: "rgb(41, 37, 36, 0.3)",
      logo: "promis",
      github: "https://github.com/FrederickAurelio/promis-web",
      list: {
        en: [
          "Built the frontend of a marketing site for an Indonesian conveyor chain supplier (Next.js, Tailwind, Framer Motion), including the product catalog, spec tables, galleries, and animated sections.",
          "Skipped a backend on purpose and wired every quote button to WhatsApp, which is how the company's customers actually reach them, so there's less to maintain and enquiries arrive instantly.",
          "Set up full SEO with page metadata, Open Graph, JSON-LD structured data, a dynamic sitemap, and robots.txt, since search is how the company gets found.",
        ],
        ch: [
          "负责一家印尼输送链供应商官网的前端（Next.js、Tailwind、Framer Motion），包括产品目录、规格表、图库和带动效的板块。",
          "刻意不做后端，把每个询价按钮都接到 WhatsApp，这才是他们客户真正联系的方式，维护更少，咨询也即时到达。",
          "做了完整的 SEO：页面 metadata、Open Graph、JSON-LD 结构化数据、动态站点地图和 robots.txt，因为公司主要靠搜索被找到。",
        ],
      },
      tags: [
        "Next.js",
        "TypeScript",
        "Tailwind",
        "Framer Motion",
        "SEO / JSON-LD",
        "Radix UI",
      ],
    },
  ] satisfies DetailItem[],
};

export type ChatContent = {
  title: LocalizedText;
  launcherLabel: LocalizedText;
  placeholder: LocalizedText;
  emptyTitle: LocalizedText;
  emptyDescription: LocalizedText;
  copyLabel: LocalizedText;
  copiedLabel: LocalizedText;
  sendLabel: LocalizedText;
  stopLabel: LocalizedText;
  closeLabel: LocalizedText;
  thinkingLabel: LocalizedText;
  thinkingDoneLabel: LocalizedText;
  retrievingLabel: LocalizedText;
  routingLabel: LocalizedText;
  showThinkingLabel: LocalizedText;
  hideThinkingLabel: LocalizedText;
  chatErrorNotConfigured: LocalizedText;
  chatErrorStorage: LocalizedText;
  chatErrorUnauthorized: LocalizedText;
  chatErrorLoadHistory: LocalizedText;
  chatErrorGeneric: LocalizedText;
  chatErrorGenerating: LocalizedText;
  chatErrorVercelTimeout: LocalizedText;
  chatRetryLabel: LocalizedText;
  chatInputUnavailable: LocalizedText;
  chatDisclaimer: LocalizedText;
};

export const chat: ChatContent = {
  title: {
    en: "Ask me anything",
    ch: "问我任何问题",
  },
  launcherLabel: {
    en: "Open chat — ask me anything",
    ch: "打开聊天，问我任何问题",
  },
  placeholder: {
    en: "Ask me anything about me…",
    ch: "随便问我关于我的问题…",
  },
  emptyTitle: {
    en: "Hi, I'm Frederick",
    ch: "嗨，我是 Frederick",
  },
  emptyDescription: {
    en: "Ask about my experience, projects, or tech stack.",
    ch: "可以问我工作经历、项目或技术栈。",
  },
  copyLabel: {
    en: "Copy message",
    ch: "复制消息",
  },
  copiedLabel: {
    en: "Copied",
    ch: "已复制",
  },
  sendLabel: {
    en: "Send message",
    ch: "发送消息",
  },
  stopLabel: {
    en: "Stop generating",
    ch: "停止生成",
  },
  closeLabel: {
    en: "Close chat",
    ch: "关闭聊天",
  },
  thinkingLabel: {
    en: "Thinking…",
    ch: "思考中…",
  },
  thinkingDoneLabel: {
    en: "Thought process",
    ch: "思考过程",
  },
  retrievingLabel: {
    en: "Searching portfolio notes…",
    ch: "正在检索资料…",
  },
  routingLabel: {
    en: "Figuring out what to look up…",
    ch: "正在判断要查什么…",
  },
  showThinkingLabel: {
    en: "Show thinking",
    ch: "展开思考",
  },
  hideThinkingLabel: {
    en: "Hide thinking",
    ch: "收起思考",
  },
  chatErrorNotConfigured: {
    en: "Chat is not set up yet. Add an OpenRouter API key to enable it.",
    ch: "聊天功能尚未配置，需要添加 OpenRouter API 密钥。",
  },
  chatErrorStorage: {
    en: "Message storage is unavailable right now. Try again in a moment.",
    ch: "消息存储暂时不可用，请稍后再试。",
  },
  chatErrorUnauthorized: {
    en: "Your chat session expired. Refresh the page and try again.",
    ch: "聊天会话已失效，请刷新页面后重试。",
  },
  chatErrorLoadHistory: {
    en: "Couldn't load chat history",
    ch: "无法加载聊天记录",
  },
  chatErrorGeneric: {
    en: "Something went wrong. Try again.",
    ch: "出错了，请重试。",
  },
  chatErrorGenerating: {
    en: "A reply is still generating. Wait for it to finish or stop it first.",
    ch: "上一条回复还在生成中，请等待完成或先停止。",
  },
  chatErrorVercelTimeout: {
    en: "This reply hit Vercel's 60-second limit (Hobby plan). Any partial answer was saved — try a shorter question, or use this site for longer chats: http://120.26.45.50",
    ch: "回复超过了 Vercel Hobby 计划的 60 秒限制。已保存的部分内容仍可见——请尝试更短的问题，或使用此站点进行长对话：http://120.26.45.50",
  },
  chatRetryLabel: {
    en: "Try again",
    ch: "重试",
  },
  chatInputUnavailable: {
    en: "Chat is temporarily unavailable",
    ch: "聊天暂时不可用",
  },
  chatDisclaimer: {
    en: "Responses are AI-generated and may not always be accurate.",
    ch: "回复由 AI 生成，可能不完全准确。",
  },
};
