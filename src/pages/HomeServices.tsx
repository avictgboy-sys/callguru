import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useHomeServices, useHomeServiceCategories } from "@/hooks/useHomeServices";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Star, Briefcase, MapPin, Search, Plus, ArrowLeft, Home } from "lucide-react";

const HomeServices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data: categories } = useHomeServiceCategories();
  const { data: services, isLoading } = useHomeServices(selectedCat || undefined);

  const filtered = (services || []).filter(
    (s) =>
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Home className="w-5 h-5 text-primary" />
          <h1 className="font-heading font-bold text-lg text-foreground">হোম সার্ভিস</h1>
          {user && (
            <Link to="/create-home-service" className="ml-auto">
              <Button variant="hero" size="sm">
                <Plus className="w-4 h-4 mr-1" /> সার্ভিস দিন
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="সার্ভিস বা এক্সপার্ট খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <Button
            variant={!selectedCat ? "default" : "outline"}
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => setSelectedCat("")}
          >
            সব
          </Button>
          {(categories || []).map((cat) => (
            <Button
              key={cat.slug}
              variant={selectedCat === cat.slug ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => setSelectedCat(cat.slug === selectedCat ? "" : cat.slug)}
            >
              {cat.icon} {cat.name_bn}
            </Button>
          ))}
        </div>

        {/* Services grid */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-10">লোড হচ্ছে...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">কোনো সার্ভিস পাওয়া যায়নি</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((service) => {
              const name = service.profiles?.full_name || "Expert";
              return (
                <Link
                  key={service.id}
                  to={`/home-service/${service.id}`}
                  className="bg-card rounded-xl border border-border shadow-sm hover:shadow-elevated hover:-translate-y-0.5 transition-all p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-11 h-11 border-2 border-primary/20">
                      <AvatarImage src={service.profiles?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm text-foreground truncate">{name}</span>
                        {service.profiles?.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {service.home_service_categories?.icon} {service.home_service_categories?.name_bn}
                      </span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${service.is_available ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {service.is_available ? "Available" : "Offline"}
                    </div>
                  </div>

                  <h3 className="font-heading font-semibold text-foreground mb-1 line-clamp-1">{service.title}</h3>
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{service.description}</p>
                  )}

                  {service.area && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" /> {service.area}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5" style={{ color: "hsl(var(--star))", fill: "hsl(var(--star))" }} />
                        {(service.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Briefcase className="w-3.5 h-3.5" /> {service.total_jobs} jobs
                      </span>
                    </div>
                    <div>
                      {service.pricing_type === "fixed" ? (
                        <span className="font-heading font-bold text-primary">৳{service.fixed_price}</span>
                      ) : (
                        <span className="text-sm text-primary font-medium">
                          ৳{service.min_price}–{service.max_price}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeServices;
