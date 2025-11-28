import About from "@/components/shared/home/about";
import CTA from "@/components/shared/home/cta";
import Hero from "@/components/shared/home/hero";
import Manifestos from "@/components/shared/home/manifestoes";
import MissionVision from "@/components/shared/home/mission";
import Stats from "@/components/shared/home/stats";

export default function Home() {
  return (
    <div>
      <Hero />
      <About />
      <MissionVision />
      <Manifestos />
      <Stats />
      <CTA />
    </div>
  );
}
