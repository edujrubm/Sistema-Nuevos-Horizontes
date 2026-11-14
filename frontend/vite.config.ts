import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.NH_API_PROXY || "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/web",
    emptyOutDir: false,
    sourcemap: true,
  },
  test: {
    maxWorkers: 2,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    restoreMocks: true,
  },
});
