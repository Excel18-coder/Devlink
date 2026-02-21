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

      <div className="container relative z-10 mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-16">
        <div className="max-w-3xl mx-auto sm:mx-0 text-center sm:text-left">

          {/* Badge */}
          <div className="flex justify-center sm:justify-start mb-3 sm:mb-6 animate-fade-in">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 max-w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium text-primary leading-tight">
                Africa&apos;s #1 Tech Talent Marketplace
              </span>
            </div>
          </div>

          {/* Brand name on mobile */}
          <p className="block sm:hidden text-xs font-semibold text-primary/70 uppercase tracking-widest mb-2 animate-fade-in">
            Afristack
          </p>

          <h1
            className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-heading font-bold text-secondary-foreground leading-tight mb-3 sm:mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Hire the world&apos;s best{" "}
            <span className="text-gradient">software talent</span>
          </h1>

          <p
            className="text-sm sm:text-xl text-secondary-foreground/60 max-w-xl mb-5 sm:mb-8 mx-auto sm:mx-0 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Connect with vetted developers for remote, contract, and full-time roles.
            Milestone-based contracts. Zero hassle.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5 sm:mb-8 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              variant="hero"
              size="lg"
              className="text-sm sm:text-base w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6"
              onClick={() => navigate("/developers")}
            >
              Hire Developers <ArrowRight className="ml-1 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              className="text-sm sm:text-base w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6"
              onClick={() => navigate("/register?role=developer")}
            >
              Apply as Developer
            </Button>
          </div>

          {/* Quick search */}
          <div
            className="relative max-w-lg mx-auto sm:mx-0 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search: React, Python, Go..."
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-secondary-foreground/5 border border-secondary-foreground/10 text-secondary-foreground placeholder:text-secondary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all font-body text-sm sm:text-base"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
