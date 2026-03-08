import { useState, useRef, useEffect, useCallback } from "react";
import { useLiveChannels, LiveChannel } from "@/hooks/useLiveChannels";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tv, X, Volume2, VolumeX, Maximize, ChevronRight } from "lucide-react";
import Hls from "hls.js";
import AdBanner from "@/components/ads/AdBanner";

const LiveTVSection = () => {
  const { data: channels, isLoading } = useLiveChannels();
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const playChannel = useCallback((channel: LiveChannel) => {
    setActiveChannel(channel);
  }, []);

  useEffect(() => {
    if (!activeChannel || !videoRef.current) return;

    const video = videoRef.current;
    const url = activeChannel.stream_url;

    // Cleanup previous
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else {
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = url;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel]);

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

      {/* Ad between player and channel list */}
      {activeChannel && (
        <div className="my-2">
          <AdBanner slot="live-tv" />
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
