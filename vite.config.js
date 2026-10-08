import { defineConfig } from 'vite';

// GitHub Pages serves the site at /greck-dashboard/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/greck-dashboard/' : '/',
});
