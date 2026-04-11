import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "mobile-capture-rewrite",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith("/mobile-capture/")) {
            req.url = "/mobile-capture.html";
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 8888,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
      // Proxy Socket.IO — cả HTTP long-polling và WebSocket upgrade
      "/socket.io": {
        target: "http://localhost:5002",
        changeOrigin: true,
        ws: true,          // forward WebSocket upgrade
        rewriteWsOrigin: true,
      },
    },
  },
});
