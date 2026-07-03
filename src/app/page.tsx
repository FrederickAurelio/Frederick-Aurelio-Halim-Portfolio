import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import TechStack from "@/components/sections/TechStack";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Details from "@/components/sections/Details";
import Footer from "@/components/sections/Footer";
import {
  SITE_DESCRIPTION,
  SITE_JOB_TITLE,
  SITE_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_JOB_TITLE}`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <TechStack />
      <Experience />
      <Projects />
      <Details />
      <Footer />
    </main>
  );
}
