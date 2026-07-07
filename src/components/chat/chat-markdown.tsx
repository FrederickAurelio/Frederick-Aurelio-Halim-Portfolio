"use client";

import { memo, useMemo } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { repairStreamingMarkdown, splitMarkdownBlocks } from "@/lib/chat/markdown-blocks";
import { cn } from "@/lib/utils";

const REMARK_PLUGINS = [remarkGfm, remarkBreaks];

const LINK_CLASS =
  "font-medium text-sky-600 underline decoration-sky-600/40 underline-offset-2 transition-colors hover:text-sky-700 hover:decoration-sky-700";

export const CHAT_MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {children}
    </a>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => (
    <h3 className="mt-3 mb-2 text-base font-semibold text-slate-900 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="mt-3 mb-1.5 text-sm font-semibold text-slate-900 first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mt-2.5 mb-1.5 text-sm font-medium text-slate-900 first:mt-0">{children}</h5>
  ),
  h4: ({ children }) => (
    <h6 className="mt-2 mb-1 text-sm font-medium text-slate-800 first:mt-0">{children}</h6>
  ),
  h5: ({ children }) => (
    <h6 className="mt-2 mb-1 text-sm font-medium text-slate-800 first:mt-0">{children}</h6>
  ),
  h6: ({ children }) => (
    <h6 className="mt-2 mb-1 text-sm font-medium text-slate-700 first:mt-0">{children}</h6>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children, className }) => (
    <li className={cn("pl-0.5", className?.includes("task-list-item") && "list-none -ml-4")}>
      {children}
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
  del: ({ children }) => <del className="text-slate-500 line-through">{children}</del>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-sky-300/80 py-0.5 pl-3 text-slate-600 last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
  code: ({ className, children, ...props }) => {
    const isInline = !className;

    if (isInline) {
      return (
        <code
          className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-[0.85em] text-slate-800"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code className={cn("font-mono text-xs leading-relaxed", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-slate-800 px-3 py-2.5 text-slate-100 last:mb-0">
      {children}
    </pre>
  ),
  input: ({ checked, ...props }) => (
    <input
      type="checkbox"
      checked={checked ?? false}
      readOnly
      disabled
      className="mr-2 size-3.5 shrink-0 accent-sky-500"
      {...props}
    />
  ),
  table: ({ children }) => (
    <div className="mb-2 max-w-full overflow-x-auto last:mb-0">
      <table className="w-max min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 px-2.5 py-1.5 align-top text-slate-800">{children}</td>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="my-2 max-w-full rounded-lg border border-slate-200"
      loading="lazy"
    />
  ),
};

const MarkdownBlock = memo(
  function MarkdownBlock({ content }: { content: string }) {
    return (
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={CHAT_MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    );
  },
  (prev, next) => prev.content === next.content,
);

type ChatMarkdownProps = {
  content: string;
  isStreaming?: boolean;
};

export default function ChatMarkdown({ content, isStreaming = false }: ChatMarkdownProps) {
  const blocks = useMemo(() => {
    const repaired = isStreaming ? repairStreamingMarkdown(content) : content;
    return splitMarkdownBlocks(repaired);
  }, [content, isStreaming]);

  return (
    <div className="chat-markdown min-w-0 max-w-full break-words [&_ul.contains-task-list]:list-none [&_ul.contains-task-list]:pl-0">
      {blocks.map((block, index) => (
        <MarkdownBlock key={index} content={block} />
      ))}
    </div>
  );
}
