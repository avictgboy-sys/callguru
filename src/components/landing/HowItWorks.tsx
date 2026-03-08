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
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            How CallGuru Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Getting expert advice has never been easier. Three simple steps to your next consultation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-glow transition-all duration-300">
                <step.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-heading font-bold text-sm text-muted-foreground">
                {i + 1}
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
