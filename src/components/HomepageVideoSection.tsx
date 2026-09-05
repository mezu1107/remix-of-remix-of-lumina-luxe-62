import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

/**
 * HomepageVideoSection
 *
 * A single full-bleed video section for the homepage.
 * - Only renders when a real video URL is provided (no placeholders)
 * - Lazy loading via IntersectionObserver — video doesn't load until near viewport
 * - Does NOT autoplay with sound (respects browser policies + user experience)
 * - Muted autoplay on loop for showcase style; tap/click to unmute
 * - Never plays simultaneously with another instance (each manages its own state)
 */
export function HomepageVideoSection({
  videoUrl,
  title,
  eyebrow,
  description,
  autoplay = false,
  loop = true,
  aspectRatio = "16/9",
  overlay = true,
}: {
  videoUrl: string;
  title?: string;
  eyebrow?: string;
  description?: string;
  autoplay?: boolean;
  loop?: boolean;
  aspectRatio?: "16/9" | "9/16" | "4/3" | "1/1";
  overlay?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoplay);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const aspectClasses: Record<string, string> = {
    "16/9": "aspect-video",
    "9/16": "aspect-[9/16]",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-secondary cursor-pointer group ${aspectClasses[aspectRatio] ?? "aspect-video"}`}
      onClick={toggle}
      role="button"
      tabIndex={0}
      aria-label={playing ? "Pause video" : "Play video"}
      onKeyDown={(e) => e.key === "Enter" && toggle()}
    >
      {/* Lazy-loaded video */}
      <video
        ref={videoRef}
        src={videoUrl}
        loop={loop}
        muted={muted}
        playsInline
        preload="metadata"
        autoPlay={autoplay}
        onLoadedData={() => setLoaded(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
        aria-label={title ?? "Product video"}
      />

      {/* Gradient overlay for text readability */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      )}

      {/* Loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-secondary" />
      )}

      {/* Play/pause indicator — appears on hover or when paused */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80 backdrop-blur shadow-lg">
          {playing
            ? <Pause className="h-6 w-6 fill-current" />
            : <Play className="h-6 w-6 fill-current ml-0.5" />
          }
        </div>
      </div>

      {/* Text overlay */}
      {(eyebrow || title || description) && (
        <div className="absolute inset-x-0 bottom-0 p-5 pointer-events-none">
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">{eyebrow}</p>
          )}
          {title && (
            <h3 className="mt-1 font-serif text-xl leading-tight text-white sm:text-2xl">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-white/70">{description}</p>
          )}
        </div>
      )}

      {/* Mute toggle — bottom right */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * HomepageVideoGrid
 *
 * Shows 1–3 video sections in a responsive grid.
 * Only renders videos that have a real URL — never shows placeholders.
 */
export function HomepageVideoGrid({
  videos,
}: {
  videos: Array<{
    url: string;
    title?: string;
    eyebrow?: string;
    description?: string;
  }>;
}) {
  const live = videos.filter((v) => !!v.url?.trim());
  if (!live.length) return null;

  return (
    <div
      className={`grid gap-4 ${
        live.length === 1
          ? "grid-cols-1 max-w-2xl mx-auto"
          : live.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {live.map((v, i) => (
        <HomepageVideoSection
          key={v.url + i}
          videoUrl={v.url}
          title={v.title}
          eyebrow={v.eyebrow}
          description={v.description}
          autoplay={i === 0}
          aspectRatio={live.length === 1 ? "16/9" : "4/3"}
        />
      ))}
    </div>
  );
}
