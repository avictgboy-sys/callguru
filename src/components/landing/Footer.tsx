import { Video } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-base sm:text-lg text-foreground">CallGuru</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Expert video consultations, anytime, anywhere.
            </p>
          </div>
          {[
            { title: "Platform", links: ["How It Works", "Categories", "Pricing", "For Experts"] },
            { title: "Support", links: ["Help Center", "Contact Us", "Report Issue", "FAQ"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Refund Policy"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-heading font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">{col.title}</h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-border text-center text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} CallGuru. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
