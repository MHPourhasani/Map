import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        port: 5173,
    },
    build: {
        target: "es2022",
        sourcemap: false,
        // MapLibre GL JS is inherently large (~1.5 MB raw / ~460 KB gzip);
        // it is loaded eagerly because the map is the entire application.
        chunkSizeWarningLimit: 1800,
    },
});
