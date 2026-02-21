import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100svh] sm:min-h-[90vh] flex items-center hero-section overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/70 to-secondary/50" />
      </div>

      {/* Geometric accents - hidden on mobile to avoid overflow */}
      <div className="hidden sm:block absolute top-20 right-0 w-80 h-80 bg-primary/10 rounded-full blur-2xl" />
      <div className="hidden sm:block absolute bottom-20 left-0 w-64 h-64 bg-accent/8 rounded-full blur-2xl" />

      <div className="container relative z-10 mx-auto px-4 pt-24 pb-12 sm:pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
            <span className="text-xs font-medium text-primary">
              10,000+ developers • 50+ countries
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-bold text-secondary-foreground leading-tight mb-4 sm:mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Hire the world&apos;s best{" "}
            <span className="text-gradient">software talent</span>
          </h1>

          <p className="text-base sm:text-xl text-secondary-foreground/60 max-w-xl mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Connect with vetted developers for remote, contract, and full-time roles.
            Milestone-based contracts. Zero hassle.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button
              variant="hero"
              size="lg"
              className="text-base w-full sm:w-auto px-8 py-6"
              onClick={() => navigate("/developers")}
            >
              Hire Developers <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              className="text-base w-full sm:w-auto px-8 py-6"
              onClick={() => navigate("/register?role=developer")}
            >
              Apply as Developer
            </Button>
          </div>

          {/* Quick search */}
          <div className="relative max-w-lg animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by skill: React, Python, Go..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 text-secondary-foreground placeholder:text-secondary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all font-body text-sm sm:text-base"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
