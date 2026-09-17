import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import type { PluginContext } from "rollup";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const maplibreWorkerAssets: Plugin = {
  name: "maplibre-worker-assets",
  configureServer(server: ViteDevServer) {
    for (const name of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
      server.middlewares.use(`/assets/${name}`, (_request, response) => {
        response.setHeader("Content-Type", "text/javascript");
        response.end(readFileSync(resolve(__dirname, "node_modules/maplibre-gl/dist", name)));
      });
    }
  },
  generateBundle(this: PluginContext) {
    for (const name of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
      this.emitFile({
        type: "asset",
        fileName: `assets/${name}`,
        source: readFileSync(resolve(__dirname, "node_modules/maplibre-gl/dist", name)),
      });
    }
  },
};

export default defineConfig({
  plugins: [vue(), maplibreWorkerAssets],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ["maplibre-gl"],
          turf: ["@turf/turf"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
