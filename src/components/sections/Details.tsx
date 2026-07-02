"use client";

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
          className={`relative grid w-full grid-cols-1 rounded-2xl border-2 p-5 lg:grid-cols-4 lg:p-10 ${detail.color}`}
        >
          <Logo logo={detail.logo} />
          <div className="lg:col-span-3">
            <p className="mb-2 text-xl font-semibold text-sky-800 md:text-2xl">
              {details.desc[language]}
            </p>
            <ul className="list-disc pl-5 text-[15px] text-sky-950 md:text-lg">
              {detail.list[language].map((list, j) => (
                <li key={j}>{list}</li>
              ))}
            </ul>
          </div>
          <GithubRepo github={detail.github} />
        </SpotlightCard>
      ))}
    </section>
  );
}
