import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSetting } from "@/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  ArrowLeft,
  Coins,
  Wallet,
  Trophy,
  Lock,
  CheckCircle,
  Sparkles,
  Gift,
  Star,
  TrendingUp,
  Video,
} from "lucide-react";

const Rewards = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [convertAmount, setConvertAmount] = useState("");
  const pointsToTakaRate = parseInt(useSetting("points_to_taka_rate") || "10", 10);

  const myPoints = profile?.points || 0;

  // Fetch all badges
  const { data: allBadges } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("points_required", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's unlocked badges
  const { data: userBadges } = useQuery({
    queryKey: ["user-badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map((b: any) => b.badge_id));
    },
  });

  // Fetch redemption history
  const { data: history } = useQuery({
    queryKey: ["redemption-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_redemptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Convert points to wallet
  const convertMutation = useMutation({
    mutationFn: async (points: number) => {
      // Atomic server-side conversion (points deduction, wallet credit,
      // redemption log and transaction log all happen in one transaction)
      const { error } = await supabase.rpc("convert_points_to_wallet", {
        p_points: points,
        p_rate: pointsToTakaRate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redemption-history"] });
      queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
      toast.success("পয়েন্ট সফলভাবে ওয়ালেটে কনভার্ট হয়েছে!");
      setConvertAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Unlock badge
  const unlockBadgeMutation = useMutation({
    mutationFn: async (badge: any) => {
      // Insert user badge
      const { error } = await supabase.from("user_badges").insert({
        user_id: user!.id,
        badge_id: badge.id,
      });
      if (error) throw error;

      // Log redemption
      await supabase.from("points_redemptions").insert({
        user_id: user!.id,
        type: "badge_unlock",
        points_spent: 0,
        description: `Unlocked badge: ${badge.name}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
      queryClient.invalidateQueries({ queryKey: ["redemption-history"] });
      toast.success("ব্যাজ আনলক হয়েছে! 🎉");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleConvert = () => {
    const pts = parseInt(convertAmount, 10);
    if (!pts || pts <= 0) return toast.error("সঠিক পয়েন্ট দিন");
    if (pts > myPoints) return toast.error("পর্যাপ্ত পয়েন্ট নেই");
    if (pts < pointsToTakaRate) return toast.error(`সর্বনিম্ন ${pointsToTakaRate} পয়েন্ট দরকার`);
    convertMutation.mutate(pts);
  };

  const takaPreview = convertAmount ? (parseInt(convertAmount, 10) / pointsToTakaRate).toFixed(2) : "0.00";

  // Calculate progress to next badge
  const nextBadge = allBadges?.find(
    (b) => b.points_required > myPoints && !userBadges?.has(b.id)
  );
  const prevBadgePoints = allBadges
    ?.filter((b) => b.points_required <= myPoints)
    ?.slice(-1)[0]?.points_required || 0;
  const progressPercent = nextBadge
    ? Math.min(100, ((myPoints - prevBadgePoints) / (nextBadge.points_required - prevBadgePoints)) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-secondary/50">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center h-14 px-4 gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-heading font-bold text-lg text-foreground">Rewards</h1>
          </div>
        </div>
      </nav>

      <div className="pt-14 pb-8">
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
          {/* Points Overview Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium">আপনার পয়েন্ট</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-heading font-extrabold">{myPoints}</span>
                    <Coins className="w-6 h-6 text-primary-foreground/60" />
                  </div>
                  <p className="text-primary-foreground/70 text-xs mt-2">
                    ≈ ৳{(myPoints / pointsToTakaRate).toFixed(2)} মূল্যের
                  </p>
                </div>
                <div className="w-20 h-20 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary-foreground/80" />
                </div>
              </div>

              {/* Progress to next badge */}
              {nextBadge && (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-primary-foreground/70 mb-1.5">
                    <span>পরবর্তী ব্যাজ: {nextBadge.name}</span>
                    <span>{nextBadge.points_required} pts</span>
                  </div>
                  <div className="w-full h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-foreground/60 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById("convert-section")?.scrollIntoView({ behavior: "smooth" })}>
              <CardContent className="flex flex-col items-center gap-2 p-5">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-foreground">ওয়ালেটে কনভার্ট</span>
                <span className="text-xs text-muted-foreground">{pointsToTakaRate} pts = ৳1</span>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById("badges-section")?.scrollIntoView({ behavior: "smooth" })}>
              <CardContent className="flex flex-col items-center gap-2 p-5">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm font-semibold text-foreground">ব্যাজ সমূহ</span>
                <span className="text-xs text-muted-foreground">
                  {userBadges?.size || 0}/{allBadges?.length || 0} আনলক
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Convert to Wallet */}
          <Card id="convert-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-green-600" />
                পয়েন্ট → ওয়ালেট ব্যালেন্স
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                প্রতি <strong>{pointsToTakaRate} পয়েন্ট</strong> = <strong>৳1</strong> ওয়ালেটে যোগ হবে
              </p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="পয়েন্ট সংখ্যা"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    min={pointsToTakaRate}
                    max={myPoints}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    pts
                  </span>
                </div>
                <Button
                  onClick={handleConvert}
                  disabled={convertMutation.isPending || !convertAmount}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {convertMutation.isPending ? "Converting..." : "Convert"}
                </Button>
              </div>

              {/* Preview */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <span className="text-sm text-muted-foreground">আপনি পাবেন</span>
                <span className="text-lg font-bold text-foreground">৳{takaPreview}</span>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 200, 500].filter((v) => v <= myPoints).map((pts) => (
                  <Button
                    key={pts}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setConvertAmount(String(pts))}
                  >
                    {pts} pts (৳{(pts / pointsToTakaRate).toFixed(0)})
                  </Button>
                ))}
                {myPoints > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs border-primary text-primary"
                    onClick={() => setConvertAmount(String(Math.floor(myPoints / pointsToTakaRate) * pointsToTakaRate))}
                  >
                    সব কনভার্ট
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card id="badges-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-yellow-600" />
                ব্যাজ সমূহ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allBadges?.map((badge) => {
                  const unlocked = userBadges?.has(badge.id);
                  const canUnlock = myPoints >= badge.points_required && !unlocked;

                  return (
                    <div
                      key={badge.id}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        unlocked
                          ? "bg-primary/5 border-primary/30 shadow-sm"
                          : canUnlock
                          ? "bg-yellow-50 border-yellow-300 shadow-sm hover:shadow-md cursor-pointer"
                          : "bg-muted/30 border-border opacity-60"
                      }`}
                      onClick={() => {
                        if (canUnlock) unlockBadgeMutation.mutate(badge);
                      }}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <span className="text-sm font-semibold text-foreground text-center">
                        {badge.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground text-center">
                        {badge.description}
                      </span>

                      {unlocked ? (
                        <Badge variant="default" className="text-[10px] bg-primary">
                          <CheckCircle className="w-3 h-3 mr-0.5" /> আনলক
                        </Badge>
                      ) : canUnlock ? (
                        <Badge variant="secondary" className="text-[10px] bg-yellow-200 text-yellow-800">
                          <Gift className="w-3 h-3 mr-0.5" /> ক্লেইম করুন!
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          <Lock className="w-3 h-3 mr-0.5" /> {badge.points_required} pts
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                রিডেম্পশন হিস্ট্রি
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!history || history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">এখনো কোনো রিডেম্পশন হয়নি</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h: any) => (
                    <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        {h.type === "wallet_convert" ? (
                          <Wallet className="w-4 h-4 text-green-600" />
                        ) : (
                          <Star className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{h.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.created_at).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                      {h.points_spent > 0 && (
                        <span className="text-sm font-semibold text-destructive">-{h.points_spent} pts</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
