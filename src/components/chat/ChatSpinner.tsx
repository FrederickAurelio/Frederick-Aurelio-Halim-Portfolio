import { HiArrowPath } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type ChatSpinnerProps = {
  className?: string;
  label?: string;
};

export default function ChatSpinner({
  className,
  label = "Loading",
}: ChatSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <HiArrowPath
        size={16}
        aria-hidden
        className="animate-spin text-slate-400"
      />
    </span>
  );
}
