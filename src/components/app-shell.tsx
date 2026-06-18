"use client";

import { BottomNav } from "@/components/bottom-nav";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineBanner } from "@/components/offline-banner";
import { OfflineSync } from "@/components/offline-sync";
import { RegisterServiceWorker } from "@/components/register-sw";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <main className="flex-1 px-4 pt-[env(safe-area-inset-top)] pb-24">
        <div className="space-y-4 py-4">
          <OfflineBanner />
          <InstallPrompt />
          {children}
        </div>
      </main>
      <BottomNav />
      <OfflineSync />
      <RegisterServiceWorker />
    </div>
  );
}