import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "Set your own rates and availability",
  "Get paid directly to your wallet",
  "Reach thousands of clients instantly",
  "Verified expert badge & analytics",
];

const ForExperts = () => {
  return (
    <section id="for-experts" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Share Your Expertise, Earn on Your Terms
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join CallGuru as a service provider. Create your profile, set your rates, and start earning through video consultations.
            </p>
            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-foreground">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                Become a Provider <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="bg-secondary/60 rounded-2xl p-8 space-y-6">
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground mb-1">Average Earnings</p>
              <p className="font-heading text-3xl font-bold text-foreground">$2,400<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground mb-1">Top Provider Rating</p>
              <p className="font-heading text-3xl font-bold text-foreground">4.97<span className="text-lg text-muted-foreground font-normal"> / 5.0</span></p>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <p className="text-sm text-muted-foreground mb-1">Avg. Response Time</p>
              <p className="font-heading text-3xl font-bold text-foreground">&lt;30<span className="text-lg text-muted-foreground font-normal"> sec</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForExperts;
