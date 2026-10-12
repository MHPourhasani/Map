import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        port: 5173,
        // Optional same-origin proxy: set VITE_NESHAN_API_BASE=/neshan to avoid the browser's CORS preflight request
        proxy: {
            "/neshan": {
                target: "https://api.neshan.org",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/neshan/, ""),
            },
        },
    },
    build: {
        target: "es2022",
        sourcemap: false,
        // MapLibre alone is ~460 KB gzipped and is needed on first paint
        chunkSizeWarningLimit: 1800,
    },
});
