import { Shield, Zap, Globe, DollarSign, Users, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Global Talent Pool",
    description: "Access developers from 50+ countries with diverse expertise and competitive rates.",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Every developer is vetted. Contracts, messaging, and reviews are all managed in one secure place.",
  },
  {
    icon: Zap,
    title: "Fast Matching",
    description: "Filter by skills, experience, availability, and budget to find the perfect fit instantly.",
  },
  {
    icon: DollarSign,
    title: "Flexible Payments",
    description: "Hourly, monthly, or project-based billing with automated invoicing and payouts.",
  },
  {
    icon: Users,
    title: "Verified Profiles",
    description: "Every developer goes through a vetting process. Portfolios, GitHub, and reviews visible.",
  },
  {
    icon: BarChart3,
    title: "Contract Dashboard",
    description: "Track milestones, earnings, and project progress all in one place.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Everything you need to hire & get hired
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete talent marketplace with built-in trust, payments, and project management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-card border border-border card-elevated animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
