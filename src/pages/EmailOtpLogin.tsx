import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video, Mail, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

const EmailOtpLogin = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("আপনার ইমেইলে ৬ সংখ্যার কোড পাঠানো হয়েছে!");
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("৬ সংখ্যার কোড দিন");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("সফলভাবে লগইন হয়েছে!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
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
              পাসওয়ার্ড ছাড়াই লগইন করুন। ইমেইলে কোড পাঠান, কোড দিন, ব্যস!
            </p>
          </div>

          {/* Right: OTP Form */}
          <div className="w-full max-w-[400px] shrink-0">
            <div className="bg-card rounded-2xl shadow-elevated p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-foreground">
                    {step === "email" ? "Email OTP লগইন" : "কোড ভেরিফাই করুন"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {step === "email"
                      ? "আপনার ইমেইলে একটি ৬ সংখ্যার কোড পাঠানো হবে"
                      : `${email} এ কোড পাঠানো হয়েছে`}
                  </p>
                </div>
              </div>

              {step === "email" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="আপনার ইমেইল দিন"
                    className="h-12 text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full h-12 text-base font-bold"
                    disabled={loading}
                  >
                    {loading ? "পাঠানো হচ্ছে..." : "কোড পাঠান"}
                    {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(val) => setOtp(val)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full h-12 text-base font-bold"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "যাচাই হচ্ছে..." : "ভেরিফাই করুন"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-primary hover:underline"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                    }}
                  >
                    অন্য ইমেইল ব্যবহার করুন
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleSendOtp as any}
                    disabled={loading}
                  >
                    আবার কোড পাঠান
                  </button>
                </form>
              )}

              <div className="border-t border-border mt-5 pt-5 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  পাসওয়ার্ড দিয়ে লগইন করতে চান?
                </p>
                <Button variant="outline" className="h-11 px-8 font-bold text-primary border-primary hover:bg-primary/5" asChild>
                  <Link to="/login">পাসওয়ার্ড লগইন</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-muted-foreground">
        CallGuru © {new Date().getFullYear()} · Privacy · Terms
      </div>
    </div>
  );
};

export default EmailOtpLogin;
