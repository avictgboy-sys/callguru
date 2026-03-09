import { Search, Video, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find Your Expert",
    description: "Browse verified experts across 10+ categories. Check ratings, availability, and pricing.",
  },
  {
    icon: Video,
    title: "Start a Video Call",
    description: "Connect instantly via secure, HD video. Share screens, chat, and get personalized advice.",
  },
  {
    icon: CreditCard,
    title: "Pay Per Minute",
    description: "Only pay for the time you use. Transparent pricing with no hidden fees or subscriptions.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            How CallGuru Works
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-2">
            Getting expert advice has never been easier. Three simple steps to your next consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative text-center group"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-glow transition-all duration-300">
                <step.icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div className="absolute top-0 right-1/4 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center font-heading font-bold text-xs sm:text-sm text-muted-foreground">
                {i + 1}
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm sm:text-base">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
