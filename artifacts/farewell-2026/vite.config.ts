import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ✅ Cloudflare base
  base: "/",

  plugins: [
    react(), // ✅ ONLY THIS (NO TAILWIND PLUGIN)
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },

  root: path.resolve(__dirname),

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    host: "0.0.0.0",
  },

  preview: {
    port: 5173,
    host: "0.0.0.0",
  },
});