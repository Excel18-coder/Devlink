import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({
    title: "Devlink – Africa's #1 Tech Talent Marketplace | Hire Developers",
    description: "Devlink is Africa's leading tech talent marketplace. Hire vetted software developers for remote, contract, and full-time roles. Milestone-based escrow contracts. Trusted by 10,000+ developers across 50+ countries.",
    canonical: "https://devlink.co.ke",
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
