"use client";

import { HiMiniArrowUpRight } from "react-icons/hi2";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/TextContext";
import { hero } from "@/utils/data";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { useInView } from "react-intersection-observer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import SplitText from "@/components/SplitText";

export default function Hero() {
  const { language } = useLanguage();
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useGSAP(() => {
    gsap.to("#btn", {
      y: -150,
      duration: 0.4,
      delay: 1.5,
      opacity: 1,
    });
    gsap.fromTo(
      "#hero-name",
      {
        x: -40,
        opacity: 0,
      },
      { x: 0, opacity: 1, delay: 1.5, duration: 0.4 },
    );
    gsap.fromTo(
      "#arr",
      {
        translateY: "0%",
        translateX: "0%",
      },
      {
        translateY: "-10%",
        translateX: "10%",
        yoyo: true,
        repeat: -1,
        duration: 0.5,
      },
    );
  }, []);

  return (
    <>
      <section
        id="hero"
        className="relative z-10 h-dvh w-full max-w-full overflow-x-hidden overflow-y-visible bg-slate-50 p-5 md:p-10"
      >
        <Navbar />
        <img
          className="absolute left-0 top-0 -z-10 h-full w-full object-cover opacity-10"
          src="/bg.jpg"
          alt=""
          aria-hidden="true"
        />
        <div
          ref={ref}
          className="flex h-[90%] w-full min-w-0 max-w-full flex-col items-center justify-center px-1 text-center sm:px-2"
        >
          <h1
            id="hero-name"
            className="max-w-full text-base font-bold uppercase text-sky-800 md:text-2xl"
          >
            {hero[language].hero.name}
          </h1>
          <SplitText
            text={hero[language].hero.title}
            className="max-w-full pb-1 text-[clamp(1.75rem,9vw,3.75rem)] font-bold leading-tight text-sky-600 md:pb-3 md:text-6xl lg:text-7xl"
            delay={language === "en" ? 50 : 200}
            animationFrom={{ opacity: 0, transform: "translate3d(0,50px,0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
            easing="easeOutCubic"
            threshold={0.2}
            rootMargin="-50px"
          />
          <p className="w-full max-w-[44ch] px-1 text-base text-sky-800 sm:max-w-[55ch] md:text-2xl">
            {hero[language].hero.subTitle[0]}
            <span className="font-bold text-sky-500">React, Next.js, and Express</span>
            {hero[language].hero.subTitle[1]}
          </p>
        </div>
        <div id="btn" className="flex items-center justify-center opacity-0">
          <a
            href="#stack"
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-sky-500 py-2 pl-5 pr-3 font-semibold text-slate-50 duration-200 hover:scale-105"
          >
            <p>{hero[language].hero.button}</p>
            <HiMiniArrowUpRight id="arr" size={24} />
          </a>
        </div>
      </section>
      {!inView && <ScrollToTopButton />}
    </>
  );
}
