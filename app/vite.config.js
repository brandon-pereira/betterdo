/*  global __dirname, process */
import fs from "fs/promises";
import path from "path";

import { transform } from "esbuild";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { plugin as markdown, Mode } from "vite-plugin-markdown";
import { VitePWA } from "vite-plugin-pwa";
import wyw from "@wyw-in-js/vite";

import rootPackage from "../package.json";

const aliases = {
  "@components": path.resolve(__dirname, "src/components"),
  "@hooks": path.resolve(__dirname, "src/hooks"),
  "@utilities": path.resolve(__dirname, "src/utilities"),
  "@customTypes": path.resolve(__dirname, "src/customTypes")
};

const criticalCssPath = path.resolve(__dirname, "src/critical.css");
const criticalCssLink = /<link[^>]*id="critical-css"[^>]*>/;

// Inlines the skeleton's critical.css into index.html so it paints from the HTML alone,
// instead of Vite merging it into the main stylesheet that first paint would wait on.
function inlineCriticalCss() {
  return {
    name: "inline-critical-css",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        if (!criticalCssLink.test(html)) {
          throw new Error("[app] index.html is missing the critical-css link");
        }
        const { code } = await transform(await fs.readFile(criticalCssPath, "utf8"), { loader: "css", minify: true });
        return html.replace(criticalCssLink, () => `<style id="critical-css">${code.trim()}</style>`);
      }
    },
    handleHotUpdate({ file, server }) {
      if (file === criticalCssPath) {
        server.ws.send({ type: "full-reload" });
      }
    }
  };
}

export default defineConfig({
  plugins: [
    svgr({ include: "**/*.svg" }),
    react(),
    wyw(),
    markdown({ mode: [Mode.HTML] }),
    inlineCriticalCss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      registerType: "autoUpdate",
      manifest: false,
      injectRegister: false,
      devOptions: {
        enabled: false,
        type: "module",
        navigateFallback: "index.html"
      }
    })
  ],
  resolve: {
    alias: aliases
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  },
  define: {
    __VERSION__: `"${rootPackage.version}"`,
    __SERVER_URL__: `"${process.env.NODE_ENV === "production" ? "https://betterdo.app" : "http://localhost:4000"}"`,
    __APP_URL__: `"${process.env.NODE_ENV === "production" ? "https://betterdo.app" : "http://localhost:4001"}"`
  },
  base: process.env.NODE_ENV === "production" ? "/app/" : "/",
  server: {
    port: 4001
  }
});
