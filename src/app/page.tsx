import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import TechStack from "@/components/sections/TechStack";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Details from "@/components/sections/Details";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <TechStack />
      <Experience />
      <Projects />
      <Details />
      <Footer />
    </>
  );
}
