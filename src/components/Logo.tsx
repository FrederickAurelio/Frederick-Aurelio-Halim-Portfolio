import { HiMiniChartBar } from "react-icons/hi2";

type LogoProps = {
  logo: string;
};

export default function Logo({ logo }: LogoProps) {
  return (
    <div className="flex w-full flex-col justify-between pb-5 pt-2 text-3xl font-semibold md:text-4xl lg:col-span-1 lg:py-0 lg:text-[30px]">
      {logo === "quizconnect" && (
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-12 -translate-y-px text-[#a48fff]"
            aria-hidden="true"
          >
            <line x1="6" x2="10" y1="12" y2="12" />
            <line x1="8" x2="8" y1="10" y2="14" />
            <line x1="15" x2="15.01" y1="13" y2="13" />
            <line x1="18" x2="18.01" y1="11" y2="11" />
            <rect width="20" height="12" x="2" y="6" rx="2" />
          </svg>
          <h1 className="cursor-default text-3xl font-semibold text-[#d8cdef]">
            <span className="text-[#a48fff]">Quiz</span>Connect
          </h1>
        </div>
      )}
      {logo === "memories" && (
        <img className="w-24 md:w-32" src="/memories.webp" alt="memories" />
      )}
      {logo === "fxtrade" && (
        <p className="flex text-emerald-700">
          <HiMiniChartBar size={42} />
          FXTrade
        </p>
      )}
      {logo === "promis" && (
        <img className="w-40" src="/promis.png" alt="promis" />
      )}
    </div>
  );
}
