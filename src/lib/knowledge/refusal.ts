export const REFUSAL_EN =
  "I don't have that in my portfolio notes. You can ask about my projects, experience, or tech stack.";

export const REFUSAL_CH =
  "我的资料里没有这方面的信息。你可以问我项目、工作经历或技术栈。";

export function getRefusalMessage(language: "en" | "ch"): string {
  return language === "ch" ? REFUSAL_CH : REFUSAL_EN;
}

export function detectReplyLanguage(text: string): "en" | "ch" {
  return /[\u4e00-\u9fff]/.test(text) ? "ch" : "en";
}
