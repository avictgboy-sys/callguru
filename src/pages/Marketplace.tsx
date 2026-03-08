import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Video, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories, useServices } from "@/hooks/useServices";
import CategoryFilter from "@/components/marketplace/CategoryFilter";
import ServiceCard from "@/components/marketplace/ServiceCard";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Marketplace = () => {
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
    // Simple debounce
    clearTimeout((window as any).__searchTimeout);
    (window as any).__searchTimeout = setTimeout(() => setDebouncedSearch(val), 400);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Header */}
        <div className="container mx-auto px-4 mb-8">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Find Your Expert
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse verified providers across 10+ categories. Connect via live video call.
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="container mx-auto px-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search experts or services..."
                className="pl-10"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {!categoriesLoading && (
            <CategoryFilter
              categories={categories}
              activeSlug={activeCategory}
              onSelect={setActiveCategory}
            />
          )}
        </div>

        {/* Results */}
        <div className="container mx-auto px-4">
          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full mb-1" />
                  <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                  <div className="h-9 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <Video className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                No services found
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {search
                  ? `No results for "${search}". Try a different search term.`
                  : "No providers in this category yet. Check back soon or explore other categories!"}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
