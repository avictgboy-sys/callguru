import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Video className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-3xl text-primary">CallGuru</span>
          </Link>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-6 sm:p-8 border border-border">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-foreground">ইমেইল পাঠানো হয়েছে</h2>
              <p className="text-sm text-muted-foreground">
                <strong>{email}</strong> এ পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। আপনার ইমেইল চেক করুন।
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                আবার পাঠান
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-heading font-bold text-xl text-foreground text-center mb-2">
                পাসওয়ার্ড ভুলে গেছেন?
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                আপনার ইমেইল দিন, আমরা রিসেট লিংক পাঠাবো।
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="আপনার ইমেইল"
                  className="h-12 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="hero" className="w-full h-12 text-base font-bold" disabled={loading}>
                  {loading ? "পাঠানো হচ্ছে..." : "রিসেট লিংক পাঠান"}
                </Button>
              </form>
            </>
          )}

          <div className="text-center mt-5">
            <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> লগইনে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
