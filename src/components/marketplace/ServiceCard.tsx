import { Star, Clock, Video, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServiceWithProvider } from "@/hooks/useServices";

interface Props {
  service: ServiceWithProvider;
}

const ServiceCard = ({ service }: Props) => {
  const providerName = service.profiles?.full_name || "Expert";
  const isVerified = service.profiles?.is_verified;
  const avatarUrl = service.profiles?.avatar_url;
  const categoryName = service.service_categories?.name || "General";

  return (
    <div className="bg-card rounded-xl border border-border shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={providerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">
                {providerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-foreground truncate">{providerName}</span>
              {isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
            </div>
            <span className="text-xs text-muted-foreground">{categoryName}</span>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${service.is_available ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
            {service.is_available ? "Available" : "Busy"}
          </div>
        </div>

        <h3 className="font-heading font-semibold text-foreground mb-1 line-clamp-1">
          {service.title}
        </h3>
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
        )}
      </div>

      {/* Tags */}
      {service.tags && service.tags.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {service.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" style={{ color: 'hsl(var(--star))', fill: 'hsl(var(--star))' }} />
            <span className="text-sm font-medium text-foreground">
              {(service.rating ?? 0).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">({service.total_reviews ?? 0})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Video className="w-3.5 h-3.5" />
            {service.total_sessions ?? 0} sessions
          </div>
        </div>
        <div className="text-right">
          <span className="font-heading font-bold text-primary text-lg">
            ${service.price_per_minute}
          </span>
          <span className="text-xs text-muted-foreground">/min</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Button variant="hero" className="w-full" size="sm" disabled={!service.is_available}>
          <Video className="w-4 h-4 mr-1" />
          {service.is_available ? "Book Consultation" : "Currently Unavailable"}
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
