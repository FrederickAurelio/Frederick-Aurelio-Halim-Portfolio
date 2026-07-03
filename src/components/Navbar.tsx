"use client";

import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/context/TextContext";
import { hero } from "@/utils/data";
import { gsap } from "@/lib/gsap-client";

export default function Navbar() {
  const { language, changeLanguage } = useLanguage();

  useGSAP(() => {
    gsap.from("#nav", {
      y: -200,
      duration: 0.4,
      delay: 1.5,
    });
  }, []);

  return (
    <nav
      id="nav"
      className="absolute inset-x-0 top-5 z-20 flex max-w-full items-center justify-center gap-1 overflow-visible px-5 md:top-10 md:gap-2 md:px-10"
    >
      <div className="flex min-w-0 max-w-[calc(100%-2.75rem)] flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border-2 border-sky-500 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold leading-tight text-sky-800 sm:max-w-none sm:gap-x-3 sm:px-4 sm:py-2.5 sm:text-xs md:gap-5 md:rounded-xl md:px-8 md:py-5 md:text-base">
        {hero[language].navbar.map((nav) => (
          <a
            href={`#${nav.id}`}
            key={nav.id}
            className="cursor-pointer whitespace-nowrap duration-200 hover:opacity-50"
          >
            {nav.text}
          </a>
        ))}
      </div>
      <div className="-mt-2 shrink-0 pt-2">
        <button
          type="button"
          onClick={changeLanguage}
          className="cursor-pointer rounded-lg border-2 border-sky-500 bg-slate-50 px-2 py-2 text-[11px] font-semibold leading-tight text-sky-800 duration-200 hover:-translate-y-2 active:rotate-[360deg] sm:px-3 sm:py-2.5 sm:text-xs md:rounded-xl md:p-4 md:text-base"
        >
          {hero[language].to}
        </button>
      </div>
    </nav>
  );
}
