import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Megaphone, Pencil, Eye } from "lucide-react";
import { format } from "date-fns";

const MyAds = () => {
  const { user } = useAuth();

  const { data: ads, isLoading } = useQuery({
    queryKey: ["my-ads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("self_ads")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusColor = (s: string) => {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      active: "default",
      rejected: "destructive",
      completed: "default",
      paused: "secondary",
    };
    return map[s] || "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <Megaphone className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-xl font-bold text-foreground">My Ads</h1>
          </div>
          <Button size="sm" asChild>
            <Link to="/create-ad"><Plus className="w-4 h-4 mr-1" /> New Ad</Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : !ads?.length ? (
          <div className="text-center py-12 space-y-3">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">আপনার কোনো ad নেই</p>
            <Button asChild>
              <Link to="/create-ad">Create Your First Ad</Link>
            </Button>
          </div>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusColor(ad.status)} className="text-xs capitalize">{ad.status}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{ad.ad_type}</Badge>
                    </div>
                    <h3 className="font-medium text-foreground truncate">{ad.title}</h3>
                    {ad.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ad.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>৳{ad.budget}</span>
                      <span>{ad.impressions} views</span>
                      <span>{format(new Date(ad.created_at), "MMM d, yyyy")}</span>
                    </div>
                    {ad.admin_note && (
                      <p className="text-xs text-primary mt-2 bg-primary/5 px-2 py-1 rounded">
                        Admin: {ad.admin_note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {ad.status === "pending" ? (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/edit-ad/${ad.id}`}>
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/edit-ad/${ad.id}`}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                {ad.image_url && (
                  <img src={ad.image_url} alt="" className="w-full rounded-lg mt-3 max-h-32 object-cover" />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MyAds;
