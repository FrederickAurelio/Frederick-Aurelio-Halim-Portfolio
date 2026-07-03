"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { useLanguage } from "@/context/TextContext";
import { experience } from "@/utils/data";
import SpotlightCard from "@/components/SpotlightCard";

export default function Experience() {
  const { language } = useLanguage();

  useGSAP(() => {
    gsap.fromTo(
      ".experience-card",
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: "#experience",
          start: "top 65%",
        },
      },
    );
  }, []);

  return (
    <section
      id="experience"
      className="flex w-full flex-col items-center bg-linear-to-b from-slate-100 to-slate-50 p-5 py-16 md:p-10 md:py-24"
    >
      <h2 className="mb-10 text-3xl font-semibold text-sky-800 md:text-5xl">
        {experience.heading[language]}
      </h2>

      <div className="flex w-full max-w-5xl flex-col gap-6">
        {experience.jobs.map((job, i) => (
          <SpotlightCard
            key={i}
            id={`experience-${i}`}
            spotlightColor="rgba(2, 132, 199, 0.18)"
            className="experience-card w-full rounded-2xl border-2 border-sky-200 bg-white/70 p-6 shadow-lg backdrop-blur md:p-8"
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-sky-800 md:text-xl">
                  {job.role[language]}
                </h2>
                {job.url ? (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 transition-colors hover:text-sky-500 md:text-base"
                  >
                    {job.company[language]}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 opacity-50 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:opacity-100"
                      aria-hidden="true"
                    >
                      <path d="M7 17 17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-base font-medium text-sky-700 md:text-lg">
                    {job.company[language]}
                  </p>
                )}
              </div>
              <div className="mt-1 flex flex-col text-sm text-sky-600 md:mt-0 md:items-end md:text-right">
                <span className="font-medium">{job.period[language]}</span>
                <span>{job.location[language]}</span>
              </div>
            </div>

            <p className="mt-3 max-w-3xl text-sm italic leading-relaxed text-sky-900/70">
              {job.summary[language]}
            </p>

            <ul className="mt-4 flex flex-col gap-2.5 text-[15px] leading-relaxed text-sky-950 md:text-base">
              {job.bullets[language].map((bullet, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              {job.stack.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
