import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * Injects the CrazyGames SDK v3 <script> tag into the built index.html
 * ONLY when building in "crazygames" mode (`vite build --mode crazygames`).
 * The normal build output is untouched.
 */
function crazyGamesSdkInject(enabled: boolean): Plugin {
  return {
    name: 'crazygames-sdk-inject',
    transformIndexHtml(html, ctx) {
      if (ctx.server || !enabled) {
        return html; // never modify the dev server or non-CG builds
      }
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: {
              src: 'https://sdk.crazygames.com/crazygames-sdk-v3.js',
            },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

/**
 * Coolmath Games build transform: strips the Google Fonts CDN <link>/<preconnect>
 * tags so the school-safe build makes ZERO third-party network requests
 * (COPPA-friendly, firewall-proof; the CSS font stack falls back to system fonts).
 */
function coolmathStripExternal(): Plugin {
  return {
    name: 'coolmath-strip-external',
    transformIndexHtml(html) {
      return html
        .replace(/[ \t]*<link rel="preconnect"[^>]*>\n?/g, '')
        .replace(/[ \t]*<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, '');
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    // THIS IS THE MAGIC LINE TO FIX ITCH.IO PATHS
    base: './', 
    
    plugins: [react(), tailwindcss(), crazyGamesSdkInject(mode === 'crazygames'), ...(mode === 'coolmath' ? [coolmathStripExternal()] : [])],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Compile-time constant: true only in CrazyGames builds (see package.json
      // "build:crazygames"). The SDK wrapper uses it to force-enable SDK loading
      // regardless of hostname detection.
      '__CG_BUILD__': JSON.stringify(mode === 'crazygames'),
      // Compile-time constant: true only in Coolmath Games "school-safe" builds
      // (see package.json "build:coolmath"). Gates every Coolmath-specific
      // stripping in game code; identical to false in all other builds.
      '__CM_BUILD__': JSON.stringify(mode === 'coolmath'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
