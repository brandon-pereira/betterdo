/*  global __dirname, process */
import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { plugin as markdown, Mode } from "vite-plugin-markdown";
import { VitePWA } from "vite-plugin-pwa";

import rootPackage from "../package.json";

export default defineConfig({
  plugins: [
    svgr({ include: "**/*.svg" }),
    react(),
    markdown({ mode: [Mode.HTML] }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
        type: "module",
        navigateFallback: "index.html"
      }
    })
  ],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "/src/components"),
      "@hooks": path.resolve(__dirname, "/src/hooks"),
      "@utilities": path.resolve(__dirname, "/src/utilities"),
      "@customTypes": path.resolve(__dirname, "/src/customTypes")
    }
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
