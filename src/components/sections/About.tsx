"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { useLanguage } from "@/context/TextContext";
import { about } from "@/utils/data";
import SpotlightCard from "@/components/SpotlightCard";

export default function About() {
  const { language } = useLanguage();

  useGSAP(() => {
    gsap.fromTo(
      "#about-content",
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#about",
          start: "top 65%",
        },
      },
    );
    gsap.fromTo(
      "#wave",
      { rotate: -12 },
      {
        rotate: 12,
        yoyo: true,
        repeat: -1,
        duration: 0.5,
        transformOrigin: "70% 80%",
      },
    );
  }, []);

  return (
    <section
      id="about"
      className="flex w-full flex-col items-center bg-gradient-to-b from-slate-50 to-slate-100 p-5 py-16 md:p-10 md:py-24"
    >
      <h1 className="mb-10 flex gap-2 text-3xl font-semibold text-sky-800 md:text-5xl">
        <span id="wave" className="inline-block">
          👋
        </span>
        {about.heading[language]}
      </h1>

      <SpotlightCard
        id="about-card"
        spotlightColor="rgba(2, 132, 199, 0.18)"
        className="w-full max-w-5xl rounded-2xl border-2 border-sky-200 bg-white/70 p-6 shadow-lg backdrop-blur md:p-10"
      >
        <div
          id="about-content"
          className="grid grid-cols-1 items-center gap-8 md:grid-cols-3 md:gap-10"
        >
          <div className="flex flex-col items-center gap-4">
            <img
              className="h-40 w-40 rounded-2xl object-cover shadow-md md:h-48 md:w-48"
              src="/avatar2.jpg"
              alt={about.greeting[language]}
            />
            <span className="flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {about.status[language]}
            </span>
          </div>

          <div className="md:col-span-2">
            <p className="mb-3 text-xl font-semibold text-sky-800 md:text-2xl">
              {about.greeting[language]}
            </p>
            <div className="space-y-3 text-[15px] leading-relaxed text-sky-950 md:text-lg">
              {about.paragraphs[language].map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {about.focus.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SpotlightCard>
    </section>
  );
}
