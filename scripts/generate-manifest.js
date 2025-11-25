/**
 * Generate farcaster.json manifest from minikit.config.ts
 * This script is run during build to create the manifest file
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get ROOT_URL from environment
const ROOT_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.VERCEL 
    ? `https://${process.env.VERCEL}` 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

// Read minikit.config.ts
const configPath = join(__dirname, '..', 'minikit.config.ts');
if (!existsSync(configPath)) {
  console.error('❌ minikit.config.ts not found!');
  process.exit(1);
}

const configContent = readFileSync(configPath, 'utf-8');

// Extract miniapp config - simple regex-based extraction
let miniappConfig = {};

try {
  // Extract the miniapp object content
  const miniappMatch = configContent.match(/miniapp:\s*\{([\s\S]*?)\},?\s*\}/);
  
  if (miniappMatch) {
    const miniappContent = miniappMatch[1];
    
    // Helper function to extract string values
    const extractString = (key) => {
      const regex = new RegExp(`${key}:\\s*[\`'"]([^'"\`]+)[\`'"]`, 'g');
      const match = regex.exec(miniappContent);
      return match ? match[1] : null;
    };
    
    // Helper function to extract template literal with ROOT_URL
    const extractTemplate = (key) => {
      const regex = new RegExp(`${key}:\\s*[\`']\\$\\{ROOT_URL\\}([^'"\`]+)[\`']`, 'g');
      const match = regex.exec(miniappContent);
      return match ? `${ROOT_URL}${match[1]}` : null;
    };
    
    // Helper function to extract array
    const extractArray = (key) => {
      const regex = new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`, 'g');
      const match = regex.exec(miniappContent);
      if (match) {
        // Extract URLs from array
        const urlMatch = match[1].match(/`\$\{ROOT_URL\}([^`]+)`/);
        if (urlMatch) {
          return [`${ROOT_URL}${urlMatch[1]}`];
        }
      }
      return null;
    };
    
    miniappConfig = {
      version: extractString('version') || '1',
      name: extractString('name') || 'Base Galaga',
      subtitle: extractString('subtitle') || 'Galaga-style Shooter MiniApp',
      description: extractString('description') || 'A classic Galaga-style shooter game',
      screenshotUrls: extractArray('screenshotUrls') || [`${ROOT_URL}/screenshot-portrait.png`],
      iconUrl: extractTemplate('iconUrl') || `${ROOT_URL}/icon.png`,
      splashImageUrl: extractTemplate('splashImageUrl') || `${ROOT_URL}/splash.png`,
      splashBackgroundColor: extractString('splashBackgroundColor') || '#000000',
      homeUrl: ROOT_URL,
      webhookUrl: extractTemplate('webhookUrl') || `${ROOT_URL}/api/webhook`,
      primaryCategory: extractString('primaryCategory') || 'games',
      tags: (() => {
        const tagsMatch = miniappContent.match(/tags:\s*\[([^\]]+)\]/);
        if (tagsMatch) {
          return tagsMatch[1]
            .split(',')
            .map(t => t.trim().replace(/['"]/g, ''))
            .filter(t => t);
        }
        return ['game', 'shooter', 'galaga', 'arcade'];
      })(),
      heroImageUrl: extractTemplate('heroImageUrl') || `${ROOT_URL}/hero.png`,
      tagline: extractString('tagline') || 'Classic arcade shooting action on Base',
      ogTitle: extractString('ogTitle') || 'Base Galaga - MiniApp Game',
      ogDescription: extractString('ogDescription') || 'Play the classic Galaga-style shooter game on Base MiniApp',
      ogImageUrl: extractTemplate('ogImageUrl') || `${ROOT_URL}/og-image.png`,
    };
  } else {
    throw new Error('Could not find miniapp config');
  }
} catch (error) {
  console.error('⚠️  Error parsing config, using defaults:', error.message);
  // Use default config
  miniappConfig = {
    version: '1',
    name: 'Base Galaga',
    subtitle: 'Galaga-style Shooter MiniApp',
    description: 'A classic Galaga-style shooter game built with Base MiniApp SDK',
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: '#000000',
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: 'games',
    tags: ['game', 'shooter', 'galaga', 'arcade', 'gaming', 'miniapp'],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: 'Classic arcade shooting action on Base',
    ogTitle: 'Base Galaga - MiniApp Game',
    ogDescription: 'Play the classic Galaga-style shooter game on Base MiniApp',
    ogImageUrl: `${ROOT_URL}/og-image.png`,
  };
}

// Ensure directory exists
const manifestDir = join(__dirname, '..', 'public', '.well-known');
mkdirSync(manifestDir, { recursive: true });

// Write manifest
const manifestPath = join(manifestDir, 'farcaster.json');
writeFileSync(manifestPath, JSON.stringify(miniappConfig, null, 2));

console.log('✅ Generated manifest at:', manifestPath);
console.log('📝 ROOT_URL:', ROOT_URL);
console.log('📦 App Name:', miniappConfig.name);
