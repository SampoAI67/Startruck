// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
const isGhPages = process.env.GH_PAGES === 'true';

export default defineConfig({
  site: isGhPages ? 'https://sampoai67.github.io' : 'https://www.startruckitalia.it',
  base: isGhPages ? '/Startruck' : '/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
