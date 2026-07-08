"use client";

type ChatRetentionNoticeProps = {
  label: string;
};

export default function ChatRetentionNotice({ label }: ChatRetentionNoticeProps) {
  return (
    <p className="px-4 pb-2 pt-0 text-center text-[10px] leading-tight text-slate-400">
      {label}
    </p>
  );
}
