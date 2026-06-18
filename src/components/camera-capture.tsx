"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { queueOfflinePhotos } from "@/lib/offline/queue";

type CameraCaptureProps = {
  onCapture: (photos: string[]) => Promise<void>;
  disabled?: boolean;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 3)) {
      urls.push(await fileToDataUrl(file));
    }
    setPreviews(urls);
  };

  const submit = async () => {
    if (!previews.length) return;
    setLoading(true);
    try {
      if (!navigator.onLine) {
        await queueOfflinePhotos(previews);
        toast.success("Saved offline — will sync when you're back online");
        setPreviews([]);
        return;
      }
      await onCapture(previews);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {previews.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Capture ${i + 1}`}
              className="aspect-square rounded-xl object-cover"
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 active:scale-[0.98] transition-transform"
        >
          <Camera className="h-12 w-12 text-primary" />
          <span className="text-lg font-semibold">Tap to photograph product</span>
          <span className="text-sm text-muted-foreground">Up to 3 photos</span>
        </button>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-12 flex-1"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {previews.length ? "Retake" : "Gallery"}
        </Button>
        <Button
          className="h-12 flex-1 text-base"
          disabled={!previews.length || disabled || loading}
          onClick={submit}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Identifying…
            </>
          ) : (
            "Identify Product"
          )}
        </Button>
      </div>
    </div>
  );
}