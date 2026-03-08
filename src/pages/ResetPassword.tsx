import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Also listen for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("পাসওয়ার্ড মিলছে না");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      navigate("/login");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">রিকভারি টোকেন যাচাই হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Video className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-3xl text-primary">CallGuru</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-6 sm:p-8 border border-border">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-xl text-foreground text-center mb-2">নতুন পাসওয়ার্ড সেট করুন</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">আপনার নতুন পাসওয়ার্ড দিন</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="নতুন পাসওয়ার্ড"
              className="h-12 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="পাসওয়ার্ড নিশ্চিত করুন"
              className="h-12 text-base"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" variant="hero" className="w-full h-12 text-base font-bold" disabled={loading}>
              {loading ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
