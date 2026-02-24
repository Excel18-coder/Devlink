import { Search, FileCheck, Handshake, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Search & Discover",
    description: "Browse developers by skill, experience, and availability. Use filters to narrow down the perfect match.",
  },
  {
    icon: FileCheck,
    step: "02",
    title: "Review & Shortlist",
    description: "Check portfolios, GitHub profiles, ratings, and reviews. Shortlist your top candidates.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Contract & Agree",
    description: "Create milestone-based contracts. Define deliverables and timelines to kick off the project.",
  },
  {
    icon: CreditCard,
    step: "04",
    title: "Deliver & Review",
    description: "Approve completed milestones. Rate and review after completion to build platform trust.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            How Devlink works
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            From discovery to delivery in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div key={item.step} className="relative animate-fade-in" style={{ animationDelay: `${index * 0.15}s` }}>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-px bg-border" />
              )}
              <div className="relative">
                <span className="text-5xl sm:text-6xl font-heading font-bold text-primary/10">{item.step}</span>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center -mt-5 sm:-mt-6 mb-3 sm:mb-4">
                  <item.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
