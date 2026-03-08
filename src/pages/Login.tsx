import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[960px] flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16">
          
          {/* Left: Logo + Tagline */}
          <div className="flex-1 text-center lg:text-left lg:pt-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Video className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <span className="font-heading font-extrabold text-4xl sm:text-5xl text-primary">
                CallGuru
              </span>
            </Link>
            <p className="text-xl sm:text-2xl text-foreground/80 leading-relaxed max-w-md mx-auto lg:mx-0">
              বিশেষজ্ঞদের সাথে লাইভ ভিডিও কলে সংযুক্ত হোন। শিখুন, পরামর্শ নিন, এগিয়ে যান।
            </p>
          </div>

          {/* Right: Login Form */}
          <div className="w-full max-w-[400px] shrink-0">
            <div className="bg-card rounded-2xl shadow-elevated p-6 sm:p-8 border border-border">
              <Button
                variant="outline"
                className="w-full mb-5 h-11"
                onClick={handleGoogleLogin}
                type="button"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  className="h-12 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  className="h-12 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" variant="hero" className="w-full h-12 text-base font-bold" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              </form>

              <div className="text-center mt-4">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <div className="border-t border-border mt-5 pt-5 text-center">
                <Button variant="outline" className="h-11 px-8 font-bold text-primary border-primary hover:bg-primary/5" asChild>
                  <Link to="/signup">Create New Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-muted-foreground">
        CallGuru © {new Date().getFullYear()} · Privacy · Terms
      </div>
    </div>
  );
};

export default Login;
