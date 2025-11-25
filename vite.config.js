import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Plugin to generate manifest from minikit.config.ts before build
function generateManifest() {
  return {
    name: 'generate-manifest',
    buildStart() {
      try {
        console.log('📝 Generating manifest from minikit.config.ts...');
        execSync('node scripts/generate-manifest.js', { stdio: 'inherit' });
      } catch (error) {
        console.warn('⚠️  Manifest generation failed, continuing build...');
      }
    }
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  plugins: [generateManifest()]
});

