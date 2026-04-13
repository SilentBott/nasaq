import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/nasaq/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "نَسَق - المصحف الذكي",
        short_name: "نَسَق",
        description: "منصة ذكية لتنظيم الختمة القرآنية ومتابعة الورد اليومي",
        theme_color: "#042f24",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/nasaq/",
        start_url: "/nasaq/",
        orientation: "portrait",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  // 👇 السر هنا: تقسيم الملفات عشان التحميل يبقى صاروخ
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor"; // مكتبات ريأكت لوحدها
            }
            if (id.includes("@supabase")) {
              return "supabase-vendor"; // قاعدة البيانات لوحدها
            }
            if (id.includes("lucide-react")) {
              return "icons-vendor"; // الأيقونات لوحدها
            }
            return "vendor"; // باقي الحاجات
          }
        },
      },
    },
  },
});
