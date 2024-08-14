import { HiMiniArrowUpRight } from "react-icons/hi2";
import Navbar from "../components/Navbar";
import { useLanguage } from "../context/TextContext";
import { hero } from "../utils/data";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useInView } from "react-intersection-observer";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { useEffect } from "react";

function Hero() {
  const { language } = useLanguage();
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    console.log("Hero in view:", inView);
  }, [inView]);

  useGSAP(() => {
    gsap.to("#btn", {
      y: -150,
      duration: 0.4,
      delay: 1.5,
      opacity: 1,
    });
    gsap.fromTo(
      "#title",
      {
        x: -400,
        opacity: 0,
      },
      { x: 0, opacity: 1, delay: 1.5, duration: 0.4, stagger: 0.1 },
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
        className="relative z-10 h-dvh w-full bg-slate-50 p-5 md:p-10"
      >
        <Navbar />
        <img
          className="absolute left-0 top-0 -z-10 h-full w-full object-cover opacity-10"
          src="./bg.jpg"
        />
        <div
          ref={ref}
          className="flex h-[90%] w-full flex-col items-center justify-center text-center"
        >
          <p
            id="title"
            className="text-base font-bold uppercase text-sky-800 md:text-2xl"
          >
            {hero[language].hero.name}
          </p>
          <h1
            id="title"
            className="pb-1 text-5xl font-bold text-sky-600 md:pb-3 md:text-6xl lg:text-7xl"
          >
            {hero[language].hero.title}
          </h1>
          <p
            id="title"
            className="w-[44ch] text-base text-sky-800 md:w-[55ch] md:text-2xl"
          >
            {hero[language].hero.subTitle[0]}
            <span className="font-bold text-sky-500"> Nextjs/React </span>
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

export default Hero;
