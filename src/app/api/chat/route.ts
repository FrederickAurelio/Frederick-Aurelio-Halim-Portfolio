import { NextResponse } from "next/server";
import type { ChatApiRequest } from "@/lib/chat/types";

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      resolve();
    }, ms);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

function getLastUserMessage(messages: ChatApiRequest["messages"]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return messages[i].content;
  }
  return "";
}

function buildMockResponse(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("who are you") ||
    lower.includes("你是谁") ||
    lower.includes("about you") ||
    lower.includes("介绍")
  ) {
    return `I'm **Frederick Aurelio Halim** (林健昌), a frontend developer who also works full-stack.

- I build and deploy web apps with **React**, **Next.js**, and **Express**
- Graduated from Zhejiang University of Science and Technology in 2026 (B.Eng. with Honours)
- Open to frontend / full-stack roles

Ask me about a specific project if you want more detail.`;
  }

  if (
    lower.includes("tech stack") ||
    lower.includes("stack") ||
    lower.includes("技术栈") ||
    lower.includes("skills")
  ) {
    return `My main stack:

- **Frontend:** React, Next.js, TypeScript, Tailwind CSS
- **Backend:** Express, MongoDB, Supabase, Redis
- **Tools:** Docker, GitHub Actions, GSAP

I work across the whole stack — UI, API, auth, and deployment.`;
  }

  if (lower.includes("quizconnect") || lower.includes("quiz")) {
    return `**QuizConnect** is a real-time multiplayer quiz game I built.

- Host a live round with a game code; everyone answers in sync
- React frontend, Express + Socket.IO + Redis backend
- AI features via OpenRouter: draft a quiz from a PDF, explain answers, session summary
- Docker + GitHub Actions for deploy`;
  }

  if (lower.includes("mufy") || lower.includes("experience") || lower.includes("工作")) {
    return `I worked at **Mufy AI** as a frontend developer (2024–2026).

- Built features for an AI roleplay chat web app (React, TypeScript, Vite)
- Shipped homepage, details page, settings, shop, comments, badges
- Used AI coding tools in the daily workflow to ship faster`;
  }

  if (lower.includes("project") || lower.includes("项目")) {
    return `A few projects on this portfolio:

- **QuizConnect** — real-time multiplayer quiz with AI-assisted question drafting
- **FXTrade** — forex trading simulator (Next.js, Supabase)
- **Promis Conveyor Chain** — company site with SEO and WhatsApp lead flow

Pick one and I can go deeper.`;
  }

  return `I'm Frederick, a frontend / full-stack developer. I build web apps with React and Next.js, ship them end to end, and I'm open to new roles.

Try asking:
- Who are you?
- What's your tech stack?
- Tell me about QuizConnect`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatApiRequest;
    const lastMessage = getLastUserMessage(body.messages ?? []);

    if (!lastMessage.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const waitMs = 600 + Math.floor(Math.random() * 600);
    await delay(waitMs, request.signal);

    if (lastMessage.trim().toLowerCase() === "error") {
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ content: buildMockResponse(lastMessage) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
