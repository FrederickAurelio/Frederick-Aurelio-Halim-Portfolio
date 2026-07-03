"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { useLanguage } from "@/context/TextContext";
import { projects } from "@/utils/data";
import Project from "@/components/Project";

export default function Projects() {
  const { language } = useLanguage();

  useGSAP(() => {
    gsap.fromTo(
      "#rocket",
      {
        translateY: "3%",
        translateX: "-2%",
      },
      {
        translateY: "-15%",
        translateX: "5%",
        yoyo: true,
        repeat: -1,
        duration: 0.8,
      },
    );
  }, []);

  return (
    <section
      id="projects"
      className="flex w-full flex-col items-center bg-slate-50 p-5 xl:p-20 xl:py-10"
    >
      <h2 className="my-10 mb-12 flex text-3xl font-semibold text-sky-800 md:text-5xl">
        <p id="rocket">🚀</p>
        {language === "en" ? "Highlight Projects" : "精选项目"}
      </h2>
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
        {projects.projects.map((project, i) => (
          <Project key={i} project={project} />
        ))}
      </div>
    </section>
  );
}
