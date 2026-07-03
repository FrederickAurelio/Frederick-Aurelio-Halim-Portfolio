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
      "I'm a frontend developer who builds and deploys full-stack web apps, mostly with React, Next.js, and Express. I'm comfortable across the whole stack: building the interface, wiring up the API and auth, then shipping it.",
      "I picked up coding on my own before studying it properly. I graduated from Zhejiang University of Science and Technology in 2026 with a B.Eng. with Honours. What keeps me here is the problem-solving: working out the logic, then watching it click into place.",
      "Lately I've been digging into AI agents, and how agent loops and tool-use actually work under the hood. Away from the keyboard, I game a fair bit. Right now I'm looking for a team where I can build real products and keep growing as a developer.",
    ],
    ch: [
      "我是一名前端开发者，也做全栈，主要用 React、Next.js 和 Express。整条链路我都能上手：写界面、接口和认证，然后部署上线。",
      "我一开始是自学写代码，后来才正经学了这一行。2026 年我从浙江科技大学毕业，拿到工学荣誉学士学位。真正让我留下来的是解决问题的过程：把逻辑想清楚，然后看着它跑起来。",
      "最近我在研究 AI agent，想搞明白 agent loop 和工具调用在底层到底是怎么跑起来的。不写代码的时候，我挺爱打游戏。现在我想找一个团队，能一起做真实的产品，也让我不断成长。",
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
          "A Kahoot style quiz game you play live with friends. One person hosts, everyone joins with a code, and you answer in real time on a shared leaderboard.",
          "The tricky part was keeping everyone's screen in sync and not losing a game if the server hiccups mid game. I moved the round timers out of memory so they survive restarts, and let the server decide when each question ends instead of the browser.",
          "I set it up to deploy itself. The whole app is containerized with Docker (server, database, cache, and web server), and every push to main runs a GitHub Actions pipeline that builds the images and ships them to the server.",
          "It can also turn a PDF into a draft quiz. That started as a way to stop typing out test questions by hand and ended up being my favourite part.",
        ],
        ch: [
          "一个类似 Kahoot 的实时答题游戏。一个人开房，大家用房间码加入，实时抢答，共用一个排行榜。",
          "比较难的是让所有人的画面保持同步，而且服务器中途出问题也不能把这一局弄丢。我把每题的计时从内存里挪了出来，重启也不会丢，并且由服务端来决定每道题什么时候结束，而不是浏览器。",
          "我还让它能自动部署。整个应用用 Docker 容器化（服务端、数据库、缓存和 Web 服务器），每次推到 main 都会触发 GitHub Actions 流水线，自动构建镜像并发布到服务器。",
          "它还能把一份 PDF 变成一份草稿题库。本来只是想省去手动出测试题的麻烦，结果成了我最喜欢的部分。",
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
          "A digital scrapbook. You drop photos onto a canvas, decorate them with text, shapes and doodles, then share the page with friends.",
          "The editor is all custom (drag, resize, layers, undo and redo), which was the fun part to build. The fiddly bit was privacy: keeping a private photo actually private meant serving every image through a check so only the owner and their friends can see it.",
          "It's not fully finished. Friend requests and a couple of screens are still stubbed out, but it got me most of the way to something real.",
        ],
        ch: [
          "一个数字剪贴簿。把照片摆到画布上，用文字、形状和涂鸦装饰，然后分享给朋友。",
          "编辑器完全是自己写的（拖动、缩放、图层、撤销和重做），这部分做起来最有意思。麻烦的是隐私：要让私密照片真的私密，得让每张图片都走一道校验，只有作者和好友能看到。",
          "它还没完全做完，好友申请和几个页面还是半成品，但已经很接近一个真正能用的东西了。",
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
          "A pretend forex trading app. You sign up, get ¥100,000 of fake money, and practice buying and selling currencies on real exchange rates.",
          "Since it's a money app, the interesting problem was making sure nobody could cheat from the browser. Every trade is priced and checked on the server, and the database only lets the server write to it, so you can't just edit your balance in dev tools.",
          "It's a rebuild of an older React project of mine. I moved it over to Next.js and swapped the backend to Supabase along the way.",
        ],
        ch: [
          "一个模拟外汇交易的应用。注册后拿到 ¥100,000 的虚拟资金，用真实汇率练习买卖货币。",
          "因为是跟钱有关的应用，有意思的问题是不能让人从浏览器作弊。每笔交易都在服务端定价和校验，数据库也只允许服务端写入，所以你没法在开发者工具里改自己的余额。",
          "这是我之前一个 React 项目的重制版，顺手迁到了 Next.js，后端也换成了 Supabase。",
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
          "The main frontend work on a marketing site for an Indonesian company that sells conveyor chains to palm oil mills. Think product pages, spec tables, and galleries.",
          "There's no backend on purpose. Instead of a contact form nobody checks, every 'request a quote' button opens WhatsApp, which is how their customers actually reach them. Less to maintain, and enquiries come in straight away.",
          "Most of my effort went into helping it show up on Google, with proper page metadata, structured data, and a sitemap, since that's how the company gets found.",
        ],
        ch: [
          "给一家印尼卖输送链（给棕榈油厂）的公司做官网时的主要前端工作，包括产品页、规格表和图库。",
          "刻意没做后端。与其放一个没人看的联系表单，不如让每个“询价”按钮直接打开 WhatsApp，这才是他们客户真正联系的方式。维护更少，咨询也是即时到。",
          "我大部分精力花在帮它在 Google 上有好的展示，包括完整的页面 metadata、结构化数据和站点地图，因为公司主要就是靠这个被找到的。",
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
