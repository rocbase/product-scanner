"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  Laptop,
  PlusSquare,
  Share,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlatform, isInstalledPwa } from "@/lib/device";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPage() {
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<ReturnType<typeof getPlatform>>("unknown");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setInstalled(isInstalledPwa());
    setPlatform(getPlatform());

    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  const installNative = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
    setInstalled(isInstalledPwa());
  };

  if (installed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">App Installed</h1>
        <p className="text-muted-foreground">
          Product Scanner is on your {platform === "ios" ? "Home Screen" : "Dock"}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <img
          src="/icons/apple-touch-icon.png"
          alt="Product Scanner"
          className="mx-auto h-24 w-24 rounded-2xl shadow-lg"
        />
        <h1 className="mt-4 text-2xl font-bold">Install Product Scanner</h1>
        <p className="mt-2 text-muted-foreground">
          Download to your iPhone or Mac — no App Store needed.
        </p>
      </div>

      {deferredPrompt && (
        <Button className="h-14 w-full text-base" onClick={installNative}>
          <ArrowDownToLine className="mr-2 h-5 w-5" />
          Install Now
        </Button>
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-5 w-5" />
            iPhone / iPad
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Open <strong className="text-foreground">Safari</strong> (must be Safari, not Chrome)
            </li>
            <li>
              Go to this website — use the same Wi‑Fi as your Mac if testing locally
            </li>
            <li>
              Tap <Share className="inline h-4 w-4" /> <strong className="text-foreground">Share</strong>
            </li>
            <li>
              Tap <PlusSquare className="inline h-4 w-4" />{" "}
              <strong className="text-foreground">Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong className="text-foreground">Add</strong>
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Laptop className="h-5 w-5" />
            MacBook (Safari)
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Open this site in <strong className="text-foreground">Safari</strong> (macOS Sonoma or later)
            </li>
            <li>
              Click <Share className="inline h-4 w-4" /> <strong className="text-foreground">Share</strong> in the address bar
            </li>
            <li>
              Select <strong className="text-foreground">Add to Dock</strong>
            </li>
            <li>Launch from Dock or Applications like any Mac app</li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Requires macOS 14+ with Safari 17+. Site must be served over HTTPS (or localhost).
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Already installed? Open the app from your Home Screen or Dock, not the browser tab.
      </p>
    </div>
  );
}