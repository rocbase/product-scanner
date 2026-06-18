"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PhotoReorderProps = {
  photos: string[];
  onChange: (photos: string[]) => void;
};

export function PhotoReorder({ photos, onChange }: PhotoReorderProps) {
  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= photos.length) return;
    const copy = [...photos];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {photos.map((src, i) => (
        <div key={`${src}-${i}`} className="relative shrink-0">
          <img
            src={src}
            alt={`Photo ${i + 1}`}
            className="h-24 w-24 rounded-xl object-cover"
          />
          {i === 0 && (
            <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              Cover
            </span>
          )}
          <div className="mt-1 flex justify-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={i === photos.length - 1}
              onClick={() => move(i, 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}