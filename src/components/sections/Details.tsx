"use client";

import { HiMiniArrowUpRight } from "react-icons/hi2";
import GithubRepo from "@/components/GithubRepo";
import Logo from "@/components/Logo";
import SpotlightCard from "@/components/SpotlightCard";
import { useLanguage } from "@/context/TextContext";
import { details } from "@/utils/data";

export default function Details() {
  const { language } = useLanguage();

  return (
    <section
      id="details"
      className="flex min-h-dvh w-full flex-col items-center gap-10 bg-slate-100 p-5 py-16 md:px-10 md:py-16 xl:p-32 xl:py-20"
    >
      {details.details.map((detail, i) => (
        <SpotlightCard
          spotlightColor={detail.spotlight}
          id={detail.logo}
          key={i}
          className={`relative grid w-full grid-cols-1 rounded-2xl border-2 p-5 lg:grid-cols-4 lg:p-10 ${detail.color} ${detail.dark ? "text-violet-100" : ""}`}
        >
          <Logo logo={detail.logo} />
          <div className="lg:col-span-3">
            <ul
              className={`flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed md:text-lg ${detail.dark ? "text-violet-50/90" : "text-sky-950"}`}
            >
              {detail.list[language].map((list, j) => (
                <li key={j}>{list}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {detail.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-lg px-3 py-1 text-xs font-medium md:text-sm ${
                    detail.dark
                      ? "bg-white/10 text-violet-100"
                      : "bg-black/6 text-slate-700"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <GithubRepo github={detail.github} />
        </SpotlightCard>
      ))}

      <a
        href={details.moreLink}
        target="_blank"
        rel="noreferrer"
        className="mt-2 flex items-center gap-2 text-lg font-semibold text-sky-700 duration-200 hover:scale-105 hover:text-sky-500 md:text-xl"
      >
        <img src="/github.svg" alt="github" className="h-6 w-6" />
        {details.more[language]}
        <HiMiniArrowUpRight size={22} />
      </a>
    </section>
  );
}
