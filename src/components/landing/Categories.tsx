import {
  GraduationCap, Briefcase, Monitor, Heart, Dumbbell, Sparkles,
  Palette, Languages, Lightbulb, MoreHorizontal,
} from "lucide-react";

const categories = [
  { icon: GraduationCap, label: "Education & Learning", color: "text-primary" },
  { icon: Briefcase, label: "Professional Consultation", color: "text-accent" },
  { icon: Monitor, label: "Tech Support", color: "text-primary" },
  { icon: Heart, label: "Personal Advice", color: "text-accent" },
  { icon: Dumbbell, label: "Health & Fitness", color: "text-primary" },
  { icon: Sparkles, label: "Spiritual / Astrology", color: "text-accent" },
  { icon: Palette, label: "Creative Skills", color: "text-primary" },
  { icon: Languages, label: "Language Learning", color: "text-accent" },
  { icon: Lightbulb, label: "Freelancing Help", color: "text-primary" },
  { icon: MoreHorizontal, label: "Others", color: "text-muted-foreground" },
];

const Categories = () => {
  return (
    <section id="categories" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find the right expert for any need. From education to health, we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {categories.map((cat) => (
            <button
              key={cat.label}
              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <cat.icon className={`w-8 h-8 ${cat.color}`} />
              <span className="text-sm font-medium text-foreground text-center">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
