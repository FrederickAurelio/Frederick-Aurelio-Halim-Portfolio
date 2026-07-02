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
      className="absolute left-0 right-0 flex items-center justify-center gap-1 md:gap-2"
    >
      <div className="z-20 flex w-fit items-center justify-center gap-3 rounded-xl border-2 border-sky-500 bg-slate-50 px-6 py-4 text-xs font-semibold text-sky-800 md:gap-5 md:px-8 md:py-5 md:text-base">
        {hero[language].navbar.map((nav) => (
          <a
            href={`#${nav.id}`}
            key={nav.id}
            className="cursor-pointer duration-200 hover:opacity-50"
          >
            {nav.text}
          </a>
        ))}
      </div>
      <button
        onClick={changeLanguage}
        className="z-20 w-fit cursor-pointer rounded-xl border-2 border-sky-500 bg-slate-50 p-3 text-xs font-semibold text-sky-800 duration-200 hover:-translate-y-2 active:rotate-[360deg] md:p-4 md:text-base"
      >
        {hero[language].to}
      </button>
    </nav>
  );
}
