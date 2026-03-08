import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Video, ArrowLeft, Home, ShoppingBag, PlayCircle, MessageCircle, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories, useServices } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import CategoryFilter from "@/components/marketplace/CategoryFilter";
import ServiceCard from "@/components/marketplace/ServiceCard";

const Marketplace = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: services = [], isLoading: servicesLoading } = useServices(
    activeCategory,
    debouncedSearch
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimeout);
    (window as any).__searchTimeout = setTimeout(() => setDebouncedSearch(val), 400);
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground hidden sm:inline">Marketplace</span>
          </div>
          <div className="flex-1" />
          <div className="relative max-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search experts..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="px-4 py-4 max-w-5xl mx-auto">
        <div className="mb-4">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Find Your Expert</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Browse verified providers. Connect via live video call.
          </p>
        </div>

        {!categoriesLoading && (
          <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <CategoryFilter
              categories={categories}
              activeSlug={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
        )}

        {servicesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-2 bg-muted rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded mt-3" />
              </div>
            ))}
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
              <Video className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">No services found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {search ? `No results for "${search}".` : "No providers yet. Check back soon!"}
            </p>
          </div>
        )}
      </main>

      {/* Bottom nav (mobile) */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
          <div className="flex items-center justify-around h-14">
            <Link to="/" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <Home className="w-6 h-6" />
            </Link>
            <Link to="/marketplace" className="flex flex-col items-center gap-0.5 py-1">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <div className="w-5 h-[3px] bg-primary rounded-full" />
            </Link>
            <Link to="/reels" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <PlayCircle className="w-6 h-6" />
            </Link>
            <Link to="/chat" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <MessageCircle className="w-6 h-6" />
            </Link>
            <Link to="/dashboard" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
