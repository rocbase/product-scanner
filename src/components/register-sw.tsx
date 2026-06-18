"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register in production; also on localhost for install testing
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (process.env.NODE_ENV !== "production" && !isLocalhost) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // SW registration can fail in unsupported contexts
    });
  }, []);

  return null;
}