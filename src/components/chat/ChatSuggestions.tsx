"use client";

type ChatSuggestionsProps = {
  suggestions: string[];
  onSelect: (text: string) => void;
};

export default function ChatSuggestions({
  suggestions,
  onSelect,
}: ChatSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pt-2 pb-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
