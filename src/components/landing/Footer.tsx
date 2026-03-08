import { Video } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Video className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg text-foreground">CallGuru</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Expert video consultations, anytime, anywhere.
            </p>
          </div>
          {[
            { title: "Platform", links: ["How It Works", "Categories", "Pricing", "For Experts"] },
            { title: "Support", links: ["Help Center", "Contact Us", "Report Issue", "FAQ"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Refund Policy"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-heading font-semibold text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CallGuru. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
