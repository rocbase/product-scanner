"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONDITIONS } from "@/lib/constants";

type ConditionSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ConditionSelect({ value, onChange }: ConditionSelectProps) {
  return (
    <div className="space-y-2">
      <Label>Condition</Label>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="h-12 w-full">
          <SelectValue placeholder="Select condition" />
        </SelectTrigger>
        <SelectContent>
          {CONDITIONS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}