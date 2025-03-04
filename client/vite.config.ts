import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5000,
    proxy: {
      "/api": {
        target: "http://localhost:6000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
