"use client";

type ChatRetentionNoticeProps = {
  hours: number;
  labelTemplate: string;
};

export default function ChatRetentionNotice({
  hours,
  labelTemplate,
}: ChatRetentionNoticeProps) {
  const label = labelTemplate.replace("{hours}", String(hours));

  return (
    <p className="px-4 pb-2 pt-0 text-center text-[10px] leading-tight text-slate-400/80">
      {label}
    </p>
  );
}
