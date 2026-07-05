"use client";

type ChatEmptyStateProps = {
  title: string;
  description: string;
};

export default function ChatEmptyState({ title, description }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-sky-50 text-sky-500">
        <span className="text-xl">👋</span>
      </div>
      <p className="mb-1 text-sm font-semibold text-slate-900">{title}</p>
      <p className="max-w-[240px] text-sm text-slate-500">{description}</p>
    </div>
  );
}
