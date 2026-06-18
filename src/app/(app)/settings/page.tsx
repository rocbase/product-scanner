"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Download, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SETTINGS,
  hydrateSettings,
  saveSettings,
  type UserSettings,
} from "@/lib/settings";

type ServiceStatus = {
  openai: boolean;
  ebay_search: boolean;
  serpapi: boolean;
  ebay_seller_connected: boolean;
  demo_mode: boolean;
  storage: string;
};

function SettingsContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    hydrateSettings().then(setSettings);
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus);

    const ebay = params.get("ebay");
    if (ebay === "connected") toast.success("eBay seller account connected");
    if (ebay === "error") toast.error("eBay connection failed — try again");
  }, [params]);

  const update = (patch: Partial<UserSettings>) => {
    const next = saveSettings(patch);
    setSettings(next);
    toast.success("Settings saved");
  };

  const disconnectEbay = async () => {
    await fetch("/api/ebay/disconnect", { method: "POST" });
    setStatus((s) => s && { ...s, ebay_seller_connected: false });
    toast.success("eBay disconnected");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Connect services and tune your listing defaults.
        </p>
      </div>

      {status?.demo_mode && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Demo mode enabled — set API keys in <code>.env.local</code> for live data.
        </div>
      )}

      <Link
        href="/install"
        className="flex items-center justify-between rounded-2xl border bg-primary/5 border-primary/20 p-4 active:bg-primary/10"
      >
        <div>
          <p className="font-semibold">Install on iPhone or Mac</p>
          <p className="text-sm text-muted-foreground">Add to Home Screen or Dock</p>
        </div>
        <Download className="h-5 w-5 text-primary" />
      </Link>

      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <h2 className="font-semibold">Service status</h2>
        <p className="text-xs text-muted-foreground">
          Storage: {status?.storage ?? "local"}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["AI (OpenAI)", status?.openai],
            ["eBay prices", status?.ebay_search],
            ["Google Shopping", status?.serpapi],
            ["eBay seller", status?.ebay_seller_connected],
          ].map(([label, on]) => (
            <div key={label as string} className="flex items-center gap-2">
              {on ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <span className="h-4 w-4 rounded-full bg-muted" />
              )}
              <span>{label as string}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <h2 className="font-semibold">eBay seller account</h2>
        {status?.ebay_seller_connected ? (
          <div className="flex items-center justify-between gap-3">
            <Badge>Connected</Badge>
            <Button variant="outline" size="sm" onClick={disconnectEbay}>
              <Unlink className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <a
            href="/api/ebay/oauth"
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <Link2 className="mr-2 h-4 w-4" />
            Connect eBay Seller Account
          </a>
        )}
      </div>

      <Separator />

      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <h2 className="font-semibold">Listing defaults</h2>
        <div className="space-y-2">
          <Label htmlFor="markup">Target markup %</Label>
          <Input
            id="markup"
            type="number"
            inputMode="numeric"
            className="h-12"
            value={settings.default_markup_percent}
            onChange={(e) =>
              update({ default_markup_percent: parseInt(e.target.value || "0", 10) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footer">Listing footer</Label>
          <Textarea
            id="footer"
            rows={3}
            value={settings.listing_footer}
            onChange={(e) => update({ listing_footer: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}