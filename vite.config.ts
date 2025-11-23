import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      host: process.env.VITE_HMR_HOST || "host.docker.internal",
      port: parseInt(process.env.VITE_HMR_PORT || "3000"),
      protocol: process.env.VITE_HMR_PROTOCOL || "ws",
    },
  },
});
