import { Workbox } from "workbox-window";
import { isProduction } from "@utilities/env";

// Disable in dev unless needed
if ("serviceWorker" in navigator && isProduction) {
  const swUrl = import.meta.env.PROD ? "service-worker.js" : "dev-sw.js?dev-sw";
  const swType = import.meta.env.PROD ? "classic" : "module";
  const wb = new Workbox(swUrl, { type: swType });
  wb.register();
}
