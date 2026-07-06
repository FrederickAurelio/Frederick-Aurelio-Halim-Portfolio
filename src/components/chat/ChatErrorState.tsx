"use client";

type ChatErrorStateProps = {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
};

export default function ChatErrorState({
  title,
  description,
  retryLabel,
  onRetry,
}: ChatErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <span className="text-xl" aria-hidden>
          !
        </span>
      </div>
      <p className="mb-1 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mb-4 max-w-[260px] text-sm text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
      >
        {retryLabel}
      </button>
    </div>
  );
}
