"use client";

import { useLanguage } from "@/context/TextContext";
import { projects, type ProjectItem } from "@/utils/data";
import { HiChevronDown, HiMiniArrowUpRight } from "react-icons/hi2";

type ProjectProps = {
  project: ProjectItem;
};

export default function Project({ project }: ProjectProps) {
  const { language } = useLanguage();

  return (
    <div className="relative flex w-full flex-col justify-center overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-lg drop-shadow-lg">
      <img
        className="w-full rounded-xl"
        src={project.img}
        alt={project.title[language]}
      />
      <h3 className="my-2 text-xl font-semibold text-sky-900">
        {project.title[language]}
      </h3>
      <p className="text-justify text-sm text-sky-950 lg:text-base">
        {project.desc[language]}
      </p>
      <p className="flex h-full items-end justify-between py-1 font-semibold text-sky-500">
        <a
          href={project.refMore}
          className="flex cursor-pointer items-center duration-200 hover:scale-105"
        >
          {projects.link[language][0]} <HiChevronDown size={24} />
        </a>
        <a
          href={project.refSite}
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center duration-200 hover:scale-105"
        >
          {projects.link[language][1]} <HiMiniArrowUpRight size={24} />
        </a>
      </p>
      {project.vpn && (
        <span className="absolute bottom-0 text-xs text-sky-800 md:px-1 md:text-sm">
          {projects.note[language]}
        </span>
      )}
    </div>
  );
}
