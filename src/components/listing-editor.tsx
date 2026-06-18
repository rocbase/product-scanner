"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConditionSelect } from "@/components/condition-select";
import { PhotoReorder } from "@/components/photo-reorder";
import type { Listing } from "@/types";

type ListingEditorProps = {
  listing: Listing;
  onChange: (patch: Partial<Listing>) => void;
};

export function ListingEditor({ listing, onChange }: ListingEditorProps) {
  return (
    <div className="space-y-4">
      <PhotoReorder
        photos={listing.photo_order}
        onChange={(photo_order) => onChange({ photo_order })}
      />

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={listing.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-12"
          maxLength={80}
        />
        <p className="text-xs text-muted-foreground">{listing.title.length}/80</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (USD)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          inputMode="decimal"
          value={(listing.price_cents / 100).toFixed(2)}
          onChange={(e) =>
            onChange({ price_cents: Math.round(parseFloat(e.target.value || "0") * 100) })
          }
          className="h-12 text-lg font-semibold"
        />
      </div>

      <ConditionSelect
        value={listing.condition}
        onChange={(condition) => onChange({ condition })}
      />

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={8}
          value={listing.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  );
}