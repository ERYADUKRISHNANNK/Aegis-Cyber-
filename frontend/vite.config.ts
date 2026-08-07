import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Aegis Cyber Defense',
        short_name: 'Aegis',
        description: 'AI-Powered Secure Decentralized File Sharing & Cyber Defense Platform',
        theme_color: '#080811',
        background_color: '#050308',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false
      }
    },
    // Proxy WebSocket connections to backend
    ws: true
  }
});
