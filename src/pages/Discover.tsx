import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, FileText, Search, Globe, Lock, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGroups } from "@/hooks/useGroups";
import { usePages } from "@/hooks/usePages";

const Discover = () => {
  const [tab, setTab] = useState<"groups" | "pages">("groups");
  const [search, setSearch] = useState("");
  const { data: groups, isLoading: loadingGroups } = useGroups();
  const { data: pages, isLoading: loadingPages } = usePages();

  const filteredGroups = (groups || []).filter((g: any) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPages = (pages || []).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const privacyIcon = (p: string) => {
    if (p === "private") return <Lock className="w-3 h-3" />;
    if (p === "secret") return <EyeOff className="w-3 h-3" />;
    return <Globe className="w-3 h-3" />;
  };

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-3xl mx-auto">
          <Link to="/feed"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <h1 className="text-lg font-bold text-foreground">Discover</h1>
        </div>
      </div>

      <div className="pt-16 pb-8 px-4 max-w-3xl mx-auto">
        {/* Search */}
        <div className="flex items-center bg-card rounded-full border border-border px-4 py-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups & pages..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-card rounded-lg border border-border mb-4 overflow-hidden">
          <button
            onClick={() => setTab("groups")}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === "groups" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Users className="w-4 h-4" /> Groups
          </button>
          <button
            onClick={() => setTab("pages")}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === "pages" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <FileText className="w-4 h-4" /> Pages
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {tab === "groups" ? (
            loadingGroups ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !filteredGroups.length ? (
              <p className="text-center text-muted-foreground py-8">No groups found</p>
            ) : (
              filteredGroups.map((g: any) => (
                <Link key={g.id} to={`/groups/${g.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground">{g.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          {privacyIcon(g.privacy)} {g.privacy}
                        </Badge>
                        <span>{g.member_count} members</span>
                      </div>
                      {g.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{g.description}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))
            )
          ) : (
            loadingPages ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !filteredPages.length ? (
              <p className="text-center text-muted-foreground py-8">No pages found</p>
            ) : (
              filteredPages.map((pg: any) => (
                <Link key={pg.id} to={`/pages/${pg.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="w-12 h-12">
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
                    </CardContent>
                  </Card>
                </Link>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
