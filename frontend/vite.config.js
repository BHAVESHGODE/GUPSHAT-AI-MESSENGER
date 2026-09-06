import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5004",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5004",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
