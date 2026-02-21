import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl hero-section p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 bg-accent/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-secondary-foreground mb-4">
              Ready to build your next project?
            </h2>
            <p className="text-secondary-foreground/60 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Join thousands of companies and developers already using Afristack
              to ship world-class software.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-base w-full sm:w-auto px-8 py-6">
                Start Hiring <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base w-full sm:w-auto px-8 py-6">
                Join as Developer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
