import { Link } from "react-router-dom";
import { Plus, Users, Lock, EyeOff, Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";

const privacyIcon = (p: string) => {
  if (p === "private") return <Lock className="w-3.5 h-3.5" />;
  if (p === "secret") return <EyeOff className="w-3.5 h-3.5" />;
  return <Globe className="w-3.5 h-3.5" />;
};

const Groups = () => {
  const { user } = useAuth();
  const { data: groups, isLoading } = useGroups();

  return (
    <div className="min-h-screen bg-secondary/50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/feed">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">Groups</h1>
          </div>
          {user && (
            <Button size="sm" className="rounded-full gap-1" asChild>
              <Link to="/create-group">
                <Plus className="w-4 h-4" /> Create
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="pt-16 pb-8 px-4 max-w-3xl mx-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !groups?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No groups yet. Create one!</p>
          </div>
        ) : (
          groups.map((g: any) => (
            <Link key={g.id} to={`/groups/${g.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                {g.cover_image_url && (
                  <div className="h-32 bg-muted rounded-t-lg overflow-hidden">
                    <img src={g.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className={`p-4 ${!g.cover_image_url ? '' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{g.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          {privacyIcon(g.privacy)} {g.privacy}
                        </Badge>
                        <span>{g.member_count} members</span>
                      </div>
                      {g.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{g.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Groups;
