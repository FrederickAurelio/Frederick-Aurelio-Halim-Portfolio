"use client";

import { useGSAP } from "@gsap/react";
import { stacks } from "@/utils/data";
import { gsap } from "@/lib/gsap-client";
import { useLanguage } from "@/context/TextContext";

export default function TechStack() {
  const { language } = useLanguage();

  useGSAP(() => {
    gsap.to("#spin", {
      delay: 0.3,
      rotate: 360,
      duration: 3,
      scrollTrigger: {
        trigger: "#stack",
        start: "top 40%",
      },
    });
    gsap.fromTo(
      "#icon",
      {
        scale: 0,
      },
      {
        scrollTrigger: {
          trigger: "#stack",
          start: "top 40%",
        },
        scale: 1,
        stagger: {
          each: 0.2,
          from: "random",
        },
        delay: 0.3,
        duration: 0.6,
        ease: "power2.inOut",
      },
    );
  });

  return (
    <section id="stack" className="flex h-dvh w-full bg-slate-100 p-5 md:p-10">
      <div className="flex h-[90%] w-full flex-col items-center justify-center text-center">
        <h2 className="mb-10 flex text-4xl font-semibold text-sky-800 md:text-6xl lg:text-7xl">
          <p id="spin">⚙️</p>
          <p>{language === "en" ? "Tech Stack" : "技术栈"}</p>
        </h2>
        <div className="flex w-full flex-wrap justify-center gap-5 md:gap-10 xl:w-[85%]">
          {stacks.map((stack) => (
            <div
              id="icon"
              key={stack.name}
              className="group relative h-24 w-24 cursor-pointer md:h-36 md:w-36"
            >
              <img
                className="object-fit z-10 h-full w-full rounded-[25%] bg-white p-2 shadow-lg drop-shadow-lg duration-200 group-hover:-translate-y-4 md:p-3"
                alt={stack.name}
                src={stack.path}
              />
              <p className="absolute left-0 right-0 top-[85px] text-xs capitalize text-sky-800 opacity-0 duration-200 group-hover:opacity-100 md:top-[130px] md:text-base">
                {stack.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
