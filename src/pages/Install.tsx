import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, Download, Smartphone, Share, MoreVertical, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Video className="w-10 h-10 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-4xl text-primary">CallGuru</span>
          </Link>

          {isInstalled ? (
            <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-heading font-bold text-xl text-foreground">
                ইতোমধ্যে ইনস্টল হয়েছে! ✅
              </h2>
              <p className="text-muted-foreground">
                CallGuru আপনার ফোনে ইনস্টল আছে। হোম স্ক্রিন থেকে ওপেন করুন।
              </p>
              <Button variant="hero" className="w-full h-12 font-bold" asChild>
                <Link to="/">অ্যাপে যান →</Link>
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-foreground">
                CallGuru ইনস্টল করুন
              </h2>
              <p className="text-muted-foreground text-sm">
                অ্যাপ স্টোর ছাড়াই সরাসরি আপনার ফোনে ইনস্টল করুন — ফ্রি, দ্রুত, অফলাইনেও কাজ করে!
              </p>

              {/* Native install button (Android/Desktop Chrome) */}
              {deferredPrompt && (
                <Button onClick={handleInstall} variant="hero" className="w-full h-12 font-bold text-base">
                  <Download className="w-5 h-5 mr-2" />
                  এখনই ইনস্টল করুন
                </Button>
              )}

              {/* iOS Instructions */}
              {isIOS && !deferredPrompt && (
                <div className="bg-muted/50 rounded-xl p-4 text-left space-y-3">
                  <p className="font-semibold text-sm text-foreground">iPhone/iPad এ ইনস্টল করুন:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">1</span>
                      <span>Safari ব্রাউজারে নিচের <Share className="inline w-4 h-4 text-primary" /> (Share) বাটন চাপুন</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">2</span>
                      <span>"Add to Home Screen" <Plus className="inline w-4 h-4 text-primary" /> অপশন সিলেক্ট করুন</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">3</span>
                      <span>"Add" চাপুন — ব্যস, হোম স্ক্রিনে দেখবেন!</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Android fallback instructions */}
              {!isIOS && !deferredPrompt && (
                <div className="bg-muted/50 rounded-xl p-4 text-left space-y-3">
                  <p className="font-semibold text-sm text-foreground">Android এ ইনস্টল করুন:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">1</span>
                      <span>Chrome ব্রাউজারে <MoreVertical className="inline w-4 h-4 text-primary" /> মেনু চাপুন</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">2</span>
                      <span>"Install app" বা "Add to Home screen" সিলেক্ট করুন</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">3</span>
                      <span>"Install" চাপুন — হোম স্ক্রিনে অ্যাপ আসবে!</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Smartphone, label: "অফলাইন" },
                  { icon: Download, label: "দ্রুত লোড" },
                  { icon: Video, label: "ভিডিও কল" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="ghost" className="text-muted-foreground" asChild>
            <Link to="/login">ব্রাউজারেই চালিয়ে যান →</Link>
          </Button>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-muted-foreground">
        CallGuru © {new Date().getFullYear()} · Privacy · Terms
      </div>
    </div>
  );
};

export default Install;
