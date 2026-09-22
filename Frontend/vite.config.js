import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],

  server: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true
      }
    }
  },

  resolve: {
    alias: {
      "monaco-editor/esm/vs/editor/editor.api.js":
        new URL(
          "./node_modules/monaco-editor/esm/vs/editor/editor.api.js",
          import.meta.url
        ).pathname
    }
  }
})