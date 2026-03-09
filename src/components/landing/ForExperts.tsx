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
    <section id="for-experts" className="py-12 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Share Your Expertise, Earn on Your Terms
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg mb-6 sm:mb-8">
              Join CallGuru as a service provider. Create your profile, set your rates, and start earning through video consultations.
            </p>
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 sm:gap-3 text-foreground text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <Button variant="hero" size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/signup">
                Become a Provider <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="bg-secondary/60 rounded-2xl p-4 sm:p-8 space-y-4 sm:space-y-6">
            <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Average Earnings</p>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-foreground">৳24,000<span className="text-sm sm:text-lg text-muted-foreground font-normal">/mo</span></p>
            </div>
            <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Top Provider Rating</p>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-foreground">4.97<span className="text-sm sm:text-lg text-muted-foreground font-normal"> / 5.0</span></p>
            </div>
            <div className="bg-card rounded-xl p-4 sm:p-5 shadow-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg. Response Time</p>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-foreground">&lt;30<span className="text-sm sm:text-lg text-muted-foreground font-normal"> sec</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForExperts;
