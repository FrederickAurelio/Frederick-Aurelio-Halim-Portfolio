"use client";

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

type ChatLinkifiedTextProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export default function ChatLinkifiedText({
  text,
  className,
  linkClassName = "underline hover:opacity-80",
}: ChatLinkifiedTextProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }

    const url = match[0];
    parts.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {url}
      </a>,
    );
    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <p className={className}>{parts.length > 0 ? parts : text}</p>;
}
