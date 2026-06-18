"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Laptop,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlatform, isInstalledPwa } from "@/lib/device";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "mac" | "desktop">("ios");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed || isInstalledPwa()) return;

    const p = getPlatform();
    if (p === "ios" || p === "mac") {
      setPlatform(p);
      setVisible(true);
    }

    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("desktop");
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setVisible(false);
  };

  const installNative = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="flex items-center gap-2 font-semibold">
            {platform === "ios" ? (
              <Smartphone className="h-4 w-4" />
            ) : (
              <Laptop className="h-4 w-4" />
            )}
            Install on {platform === "ios" ? "iPhone" : "Mac"}
          </p>

          {platform === "ios" && (
            <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
              <li>
                Tap <Share className="inline h-4 w-4" /> <strong>Share</strong> in Safari
              </li>
              <li>
                Scroll and tap <PlusSquare className="inline h-4 w-4" />{" "}
                <strong>Add to Home Screen</strong>
              </li>
              <li>Tap <strong>Add</strong> — opens like a native app</li>
            </ol>
          )}

          {platform === "mac" && (
            <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
              <li>Open this site in <strong>Safari</strong></li>
              <li>
                Click <Share className="inline h-4 w-4" /> <strong>Share</strong> in the toolbar
              </li>
              <li>
                Choose <strong>Add to Dock</strong>
              </li>
              <li>App appears in your Dock and Applications</li>
            </ol>
          )}

          {platform === "desktop" && deferredPrompt && (
            <p className="text-sm text-muted-foreground">
              Install Product Scanner as a desktop app — works offline with camera access.
            </p>
          )}

          {platform === "desktop" && deferredPrompt && (
            <Button className="mt-2 h-11" onClick={installNative}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Install App
            </Button>
          )}
        </div>

        <Button variant="ghost" size="icon" className="shrink-0" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}