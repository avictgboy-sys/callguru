import {
  GraduationCap, Briefcase, Monitor, Heart, Dumbbell, Sparkles,
  Palette, Languages, Lightbulb, MoreHorizontal, LayoutGrid
} from "lucide-react";
import type { ServiceCategory } from "@/hooks/useServices";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap, Briefcase, Monitor, Heart, Dumbbell, Sparkles,
  Palette, Languages, Lightbulb, MoreHorizontal,
};

interface Props {
  categories: ServiceCategory[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

const CategoryFilter = ({ categories, activeSlug, onSelect }: Props) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect("all")}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
          activeSlug === "all"
            ? "bg-primary text-primary-foreground shadow-glow"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        All
      </button>
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon || ""] || MoreHorizontal;
        return (
          <button
            key={cat.slug}
            onClick={() => onSelect(cat.slug)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeSlug === cat.slug
                ? "bg-primary text-primary-foreground shadow-glow"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Icon className="w-4 h-4" />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
