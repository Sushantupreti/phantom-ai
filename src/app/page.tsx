import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import Platforms from "@/components/Platforms";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import InteractiveDynamicIsland from "@/components/InteractiveDynamicIsland";
import HowItWorks from "@/components/HowItWorks";
import BeforeAfter from "@/components/BeforeAfter";
import Testimonials from "@/components/Testimonials";
import Comparison from "@/components/Comparison";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
import PageEntrance from "@/components/PageEntrance";
import CursorGlow from "@/components/CursorGlow";
import ScrollProgress from "@/components/ScrollProgress";

export default function Home() {
  return (
    <div className="noise-overlay">
      <PageEntrance />
      <CursorGlow />
      <ScrollProgress />
      <Navbar />
      <Hero />
      <Ticker />
      <Platforms />
      <Stats />
      <Features />
      <InteractiveDynamicIsland />
      <HowItWorks />
      <BeforeAfter />
      <Testimonials />
      <Comparison />
      <Pricing />
      <FAQ />
      <Waitlist />
      <Footer />
    </div>
  );
}
