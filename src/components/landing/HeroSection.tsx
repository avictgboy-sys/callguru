import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, Video } from "lucide-react";
import heroImg from "@/assets/hero-illustration.png";

const stats = [
  { value: "10K+", label: "Expert Providers" },
  { value: "50K+", label: "Consultations" },
  { value: "4.9★", label: "Average Rating" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              Trusted by thousands of professionals
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
              Expert Advice,{" "}
              <span className="text-primary">One Video Call</span>{" "}
              Away
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Connect with verified experts across 10+ categories for live video consultations. Pay per minute, no commitments.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="lg" className="text-base" asChild>
                <Link to="/signup">
                  Start Free <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="lg" className="text-base" asChild>
                <Link to="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={heroImg}
                alt="Expert video consultations on CallGuru platform"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-elevated flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Live Now</p>
                <p className="text-xs text-muted-foreground">2,340 active sessions</p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-elevated flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Avg Response</p>
                <p className="text-xs text-muted-foreground">&lt; 30 seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
