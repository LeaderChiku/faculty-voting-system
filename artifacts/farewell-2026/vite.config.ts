import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ✅ Cloudflare base fix
  base: "/",

  plugins: [
    react(),
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

  // 🔥 LOCAL DEV ONLY (important)
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "https://faculty-voting-system.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },

  preview: {
    port: 5173,
    host: "0.0.0.0",
  },
});