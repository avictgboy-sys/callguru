import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLiveChannels, LiveChannel } from "@/hooks/useLiveChannels";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tv, X, Volume2, VolumeX, Maximize, RefreshCw } from "lucide-react";
import Hls from "hls.js";
import AdBanner from "@/components/ads/AdBanner";

// Check channel reachability by fetching first few bytes
const checkChannelSpeed = async (url: string): Promise<number> => {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch(url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
    clearTimeout(timeout);
    return performance.now() - start;
  } catch {
    return 99999; // unreachable = very slow
  }
};

const LiveTVSection = () => {
  const { data: channels, isLoading } = useLiveChannels();
  const [sortedChannels, setSortedChannels] = useState<LiveChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-sort channels by network speed
  useEffect(() => {
    if (!channels?.length) return;
    
    // Show channels immediately (unsorted)
    setSortedChannels(channels);
    
    // Then speed-test in background and re-sort
    setIsSorting(true);
    const testChannels = async () => {
      const speeds = await Promise.all(
        channels.map(async (ch) => ({
          channel: ch,
          latency: await checkChannelSpeed(ch.stream_url),
        }))
      );
      speeds.sort((a, b) => a.latency - b.latency);
      setSortedChannels(speeds.map(s => s.channel));
      setIsSorting(false);
    };
    testChannels();
  }, [channels]);

  // Get all available URLs for current channel
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

  const switchUrl = (index: number) => {
    setActiveUrlIndex(index);
    setHasError(false);
  };

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
          console.error("HLS fatal error:", data);
          setHasError(true);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Try next URL automatically
            if (activeUrlIndex < allUrls.length - 1) {
              setTimeout(() => setActiveUrlIndex(prev => prev + 1), 2000);
            }
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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (isLoading || !channels?.length) return null;

  const allUrls = activeChannel ? getAllUrls(activeChannel) : [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-foreground flex items-center gap-2 text-base">
          <Tv className="w-4 h-4 text-destructive" />
          <span>Live TV</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
        </h2>
      </div>

      {/* Player */}
      {activeChannel && (
        <div ref={containerRef} className="relative rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            muted={isMuted}
            playsInline
            autoPlay
          />

          {/* Error overlay */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
              <RefreshCw className="w-8 h-8 opacity-60" />
              <p className="text-sm">স্ট্রিম লোড হচ্ছে না</p>
              {allUrls.length > 1 && (
                <p className="text-xs text-white/60">অন্য একটি সোর্স ট্রাই করুন ↓</p>
              )}
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-end justify-between">
            <div>
              <p className="text-white text-sm font-medium">{activeChannel.name}</p>
              <p className="text-white/60 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" /> LIVE
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                <Maximize className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setActiveChannel(null); hlsRef.current?.destroy(); }}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source selector — shows when channel has multiple URLs */}
      {activeChannel && allUrls.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">সোর্স:</span>
          {allUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => switchUrl(i)}
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

      {/* Ad */}
      {activeChannel && (
        <div className="my-2">
          <AdBanner slotId="live-tv" />
        </div>
      )}

      {/* Channel list */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => playChannel(ch)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all w-20 ${
                activeChannel?.id === ch.id
                  ? "border-destructive bg-destructive/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {ch.logo_url ? (
                <img src={ch.logo_url} alt={ch.name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tv className="w-5 h-5 text-primary" />
                </div>
              )}
              <span className="text-[11px] font-medium text-foreground truncate w-full text-center leading-tight">
                {ch.name}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default LiveTVSection;
