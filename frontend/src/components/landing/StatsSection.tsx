const stats = [
  { value: "10,000+", label: "Developers" },
  { value: "50+", label: "Countries" },
  { value: "$12M+", label: "Paid Out" },
  { value: "98%", label: "Satisfaction" },
];

const StatsSection = () => {
  return (
    <section className="py-10 sm:py-16 hero-section">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center animate-count-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-secondary-foreground/50 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
