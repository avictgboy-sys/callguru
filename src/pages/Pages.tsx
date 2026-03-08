import { Link } from "react-router-dom";
import { Plus, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePages } from "@/hooks/usePages";
import { useAuth } from "@/contexts/AuthContext";

const Pages = () => {
  const { user } = useAuth();
  const { data: pages, isLoading } = usePages();

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/feed"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
            <h1 className="text-lg font-bold text-foreground">Pages</h1>
          </div>
          {user && (
            <Button size="sm" className="rounded-full gap-1" asChild>
              <Link to="/create-page"><Plus className="w-4 h-4" /> Create</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="pt-16 pb-8 px-4 max-w-3xl mx-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !pages?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No pages yet. Create one!</p>
          </div>
        ) : (
          pages.map((pg: any) => (
            <Link key={pg.id} to={`/pages/${pg.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                {pg.cover_image_url && (
                  <div className="h-28 bg-muted rounded-t-lg overflow-hidden">
                    <img src={pg.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-border">
                      <AvatarImage src={pg.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{(pg.name || "P")[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{pg.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">{pg.category || "General"}</Badge>
                        <span>{pg.follower_count} followers</span>
                      </div>
                    </div>
                  </div>
                  {pg.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{pg.description}</p>}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Pages;
