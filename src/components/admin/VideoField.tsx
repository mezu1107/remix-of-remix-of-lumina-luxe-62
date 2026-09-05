import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, X, Plus, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * VideoField — single video URL input with preview.
 *
 * Videos are stored as URLs (not base64 data URLs like images) because:
 *  - Video files are large — compressing them in the browser is not practical
 *  - The admin uploads the video to Supabase Storage, Cloudinary, or any
 *    hosting service, then pastes the URL here
 *  - The URL is stored in the database and the <video> element fetches it
 *    directly — no server upload step needed
 */
export function VideoField({
  value,
  onChange,
  label = "Video URL",
  help,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  help?: string;
}) {
  const hasVideo = !!value?.trim();

  return (
    <div className="mt-1.5 space-y-2.5">
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste MP4 / WebM video URL (e.g. from Supabase Storage or Cloudinary)"
        className="h-11"
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}

      {hasVideo && (
        <div className="relative inline-block w-full max-w-xs rounded-xl overflow-hidden border border-border bg-card">
          <video
            src={value}
            controls
            muted
            playsInline
            preload="metadata"
            className="w-full max-h-48 object-contain"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove video"
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card shadow-sm hover:text-destructive transition"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * VideosField — ordered list of video URLs.
 * Admin can:
 *  - Add a video URL
 *  - Preview each video
 *  - Remove a video
 *  - Reorder (simple up/down buttons — full drag-and-drop would need a library)
 */
export function VideosField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const url = draft.trim();
    if (!url) return;
    if (value.includes(url)) {
      toast.error("That video is already in the list");
      return;
    }
    onChange([...value, url]);
    setDraft("");
    toast.success("Video added — save the product to publish it");
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...value];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }

  function moveDown(idx: number) {
    if (idx === value.length - 1) return;
    const next = [...value];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  }

  return (
    <div className="mt-1.5 space-y-3">
      {/* Add URL input */}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Paste video URL (MP4) and press Add"
          className="h-10 flex-1"
        />
        <Button type="button" variant="outline" className="h-10 shrink-0" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Video list */}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No videos yet. Paste an MP4 URL above and click Add.
        </p>
      )}

      <div className="space-y-3">
        {value.map((url, idx) => (
          <div key={url + idx} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            {/* Reorder handles */}
            <div className="flex flex-col justify-center gap-1">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === value.length - 1}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            {/* Video preview */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-widest">
                Video {idx + 1}
              </p>
              <video
                src={url}
                controls
                muted
                playsInline
                preload="metadata"
                className="w-full max-h-36 rounded-lg object-contain bg-black/5"
              />
              <p className="mt-1 text-[10px] text-muted-foreground truncate" title={url}>
                {url}
              </p>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label="Remove video"
              className="shrink-0 self-start text-muted-foreground hover:text-destructive transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Upload videos to Supabase Storage or Cloudinary first, then paste the URL above. 
        Supported formats: MP4, WebM. Keep videos under 50 MB for fast loading.
      </p>
    </div>
  );
}
