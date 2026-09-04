import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves a project (non-custom-domain) site under
  // /<repo-name>/, so the production build's asset paths need that prefix.
  // The dev server stays at root so local preview URLs are unaffected.
  base: command === 'build' ? '/ugoki-iro-katachi/' : '/',
  plugins: [react()],
  server: {
    // Dev-only: lets the Cloudflare quick tunnel (a random *.trycloudflare.com
    // host each run) reach this server for on-device sensor testing, without
    // hardcoding a hostname that changes every time the tunnel restarts.
    allowedHosts: true,
  },
}))
