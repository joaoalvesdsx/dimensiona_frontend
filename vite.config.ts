import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // --- ADIÇÃO AQUI ---
  server: {
    proxy: {
      // Redireciona requisições de /api para o seu backend
      "/api": {
        target: "http://localhost:3110",
        changeOrigin: true,
        // Remove o '/api' antes de enviar para o backend
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  // --- FIM DA ADIÇÃO ---
});
