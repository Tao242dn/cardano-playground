import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      // Whether to polyfill `global`. Defaults to `true`.
      globals: {global: true, process: true, Buffer: true},
    }),

  ],
  resolve: {
    alias: {
      // Optional: If you need to alias other Node.js modules
    },
  },
  define: {
    // Define 'global' for modules that expect a Node.js environment
    global: 'globalThis',
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})
