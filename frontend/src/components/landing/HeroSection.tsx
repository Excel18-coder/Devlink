import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex items-center hero-section overflow-hidden min-h-screen sm:min-h-[90vh]">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-60" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/70 to-secondary/50" />
      </div>

      {/* Geometric accents - hidden on mobile */}
      <div className="hidden sm:block absolute top-20 right-0 w-80 h-80 bg-primary/10 rounded-full blur-2xl" />
      <div className="hidden sm:block absolute bottom-20 left-0 w-64 h-64 bg-accent/8 rounded-full blur-2xl" />

      <div className="container relative z-10 mx-auto px-4 pt-20 pb-10 sm:pt-24 sm:pb-16">
        <div className="max-w-3xl mx-auto sm:mx-0 text-center sm:text-left">

          {/* Badge */}
          <div className="flex justify-center sm:justify-start mb-2 sm:mb-5 animate-fade-in">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-primary leading-tight">
                Devlink &mdash; The #1 Tech Talent Marketplace
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1
            className="text-[1.35rem] leading-snug sm:text-5xl lg:text-6xl font-heading font-bold text-secondary-foreground mb-3 sm:mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Hire the world&apos;s best{" "}
            <span className="text-gradient">software talent</span>
          </h1>

          {/* Sub-text */}
          <p
            className="text-xs sm:text-xl text-secondary-foreground/60 max-w-xl mb-4 sm:mb-8 mx-auto sm:mx-0 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Connect with vetted developers for remote, contract, and full-time roles.
            Milestone-based contracts. Zero hassle.
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-8 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              variant="hero"
              size="sm"
              className="text-sm w-full sm:w-auto sm:text-base sm:px-8 sm:py-6"
              onClick={() => navigate("/developers")}
            >
              Hire Developers <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant="hero-outline"
              size="sm"
              className="text-sm w-full sm:w-auto sm:text-base sm:px-8 sm:py-6"
              onClick={() => navigate("/register?role=developer")}
            >
              Apply as Developer
            </Button>
          </div>

          {/* Quick search — hidden on very small screens, shown sm+ */}
          <div
            className="hidden sm:block relative max-w-lg mx-auto sm:mx-0 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
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
