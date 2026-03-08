import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveChannels, LiveChannel } from "@/hooks/useLiveChannels";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tv, X, Volume2, VolumeX, Maximize, Minimize, RefreshCw, Home, PlayCircle, MessageCircle, User, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import Hls from "hls.js";
import { useAuth } from "@/contexts/AuthContext";

const checkChannelSpeed = async (url: string): Promise<number> => {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch(url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
    clearTimeout(timeout);
    return performance.now() - start;
  } catch {
    return 99999;
  }
};

const categoryLabels: Record<string, string> = {
  all: "সব",
  general: "সাধারণ",
  news: "নিউজ",
  entertainment: "এন্টারটেইনমেন্ট",
  movies: "মুভিজ",
  sports: "স্পোর্টস",
  music: "মিউজিক",
  kids: "কিডস",
  religious: "ধর্মীয়",
};

const LiveTV = () => {
  const { user } = useAuth();
  const { data: channels, isLoading } = useLiveChannels();
  const [sortedChannels, setSortedChannels] = useState<LiveChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [videoScale, setVideoScale] = useState(100); // 50-200%
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-sort by speed
  useEffect(() => {
    if (!channels?.length) return;
    setSortedChannels(channels);
    setIsSorting(true);
    const testChannels = async () => {
      const speeds = await Promise.all(
        channels.map(async (ch) => ({
          channel: ch,
          latency: await checkChannelSpeed(ch.stream_url),
        }))
      );
      speeds.sort((a, b) => a.latency - b.latency);
      setSortedChannels(speeds.map((s) => s.channel));
      setIsSorting(false);
    };
    testChannels();
  }, [channels]);

  const getAllUrls = (ch: LiveChannel) => {
    const urls = [ch.stream_url];
    if (ch.alternate_urls?.length) urls.push(...ch.alternate_urls);
    return urls;
  };

  const playChannel = useCallback((channel: LiveChannel) => {
    setActiveChannel(channel);
    setActiveUrlIndex(0);
    setHasError(false);
  }, []);

  useEffect(() => {
    if (!activeChannel || !videoRef.current) return;
    const allUrls = getAllUrls(activeChannel);
    const url = allUrls[activeUrlIndex] || allUrls[0];
    const video = videoRef.current;
    setHasError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHasError(true);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && activeUrlIndex < allUrls.length - 1) {
            setTimeout(() => setActiveUrlIndex((prev) => prev + 1), 2000);
          }
          hls.destroy();
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, activeUrlIndex]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      // Try to lock to landscape
      try {
        await (screen.orientation as any)?.lock?.("landscape");
      } catch {}
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      try {
        (screen.orientation as any)?.unlock?.();
      } catch {}
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const baseChannels = sortedChannels.length ? sortedChannels : channels || [];

  const categories = useMemo(() => {
    const cats = new Set(baseChannels.map((ch) => ch.category || "general"));
    return ["all", ...Array.from(cats)];
  }, [baseChannels]);

  const displayChannels =
    activeCategory === "all"
      ? baseChannels
      : baseChannels.filter((ch) => (ch.category || "general") === activeCategory);

  const allUrls = activeChannel ? getAllUrls(activeChannel) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-destructive" />
            <h1 className="font-heading font-bold text-foreground text-lg">Live TV</h1>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            {isSorting && (
              <span className="text-[10px] text-muted-foreground font-normal ml-1">⚡ সর্টিং...</span>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-14 pb-16 px-3 space-y-4">
        {/* Player */}
        {activeChannel && (
          <div className="mt-3">
            <div ref={containerRef} className="relative rounded-xl overflow-hidden bg-black">
              <div className="w-full aspect-video overflow-hidden flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  className="transition-transform duration-200 ease-out"
                  style={{
                    width: `${videoScale}%`,
                    height: `${videoScale}%`,
                    objectFit: "contain",
                  }}
                  muted={isMuted}
                  playsInline
                  autoPlay
                />
              </div>
              {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
                  <RefreshCw className="w-8 h-8 opacity-60" />
                  <p className="text-sm">স্ট্রিম লোড হচ্ছে না</p>
                  {allUrls.length > 1 && (
                    <p className="text-xs text-white/60">অন্য একটি সোর্স ট্রাই করুন ↓</p>
                  )}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 space-y-2">
                {/* Zoom slider */}
                <div className="flex items-center gap-2 px-1">
                  <ZoomOut className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <Slider
                    value={[videoScale]}
                    onValueChange={(v) => setVideoScale(v[0])}
                    min={50}
                    max={200}
                    step={5}
                    className="flex-1 [&_[data-radix-slider-track]]:h-1 [&_[data-radix-slider-track]]:bg-white/20 [&_[data-radix-slider-range]]:bg-white/70 [&_[data-radix-slider-thumb]]:w-3.5 [&_[data-radix-slider-thumb]]:h-3.5 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-0"
                  />
                  <ZoomIn className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <span className="text-[10px] text-white/60 min-w-[32px] text-right">{videoScale}%</span>
                </div>
                {/* Bottom controls */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{activeChannel.name}</p>
                    <p className="text-white/60 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" /> LIVE
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVideoScale(100)}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition text-[10px] font-bold"
                      title="রিসেট"
                    >
                      1:1
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setActiveChannel(null);
                        hlsRef.current?.destroy();
                      }}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Source selector */}
            {allUrls.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="text-xs text-muted-foreground">সোর্স:</span>
                {allUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveUrlIndex(i);
                      setHasError(false);
                    }}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      activeUrlIndex === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    সোর্স {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Tabs */}
        {categories.length > 2 && (
          <ScrollArea className="w-full mt-3">
            <div className="flex gap-2 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Channel Grid — 4-5 per row */}
        {!isLoading && displayChannels.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {displayChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => playChannel(ch)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-md ${
                  activeChannel?.id === ch.id
                    ? "border-destructive bg-destructive/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {ch.logo_url ? (
                  <img
                    src={ch.logo_url}
                    alt={ch.name}
                    className="w-12 h-12 rounded-xl object-cover bg-secondary"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Tv className="w-6 h-6 text-primary" />
                  </div>
                )}
                <span className="text-[11px] font-medium text-foreground truncate w-full text-center leading-tight">
                  {ch.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {!isLoading && displayChannels.length === 0 && (
          <div className="text-center py-12">
            <Tv className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">কোনো চ্যানেল পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Bottom nav (mobile) */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
          <div className="flex items-center justify-around h-14">
            <Link to="/feed" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <Home className="w-6 h-6" />
            </Link>
            <Link to="/live-tv" className="flex flex-col items-center gap-0.5 py-1">
              <Tv className="w-6 h-6 text-primary" />
              <div className="w-5 h-[3px] bg-primary rounded-full" />
            </Link>
            <Link to="/reels" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <PlayCircle className="w-6 h-6" />
            </Link>
            <Link to="/chat" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <MessageCircle className="w-6 h-6" />
            </Link>
            <Link to="/dashboard" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTV;
