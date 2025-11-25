// Base MiniApp Manifest Configuration
// This file configures the manifest at app/.well-known/farcaster.json

// Get ROOT_URL from environment or use placeholder
const ROOT_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

export const minikitConfig = {
  accountAssociation: {
    // This will be added in step 5 after signing the manifest
    "header": "",
    "payload": "",
    "signature": ""
  },
  baseBuilder: {
    // Base account address - will be set during account association
    "ownerAddress": "0xb44196187874DAA0E85ef96D3A4332F83FAee173"
  },
  miniapp: {
    version: "1",
    name: "Base Galaga",
    subtitle: "Galaga-style Shooter MiniApp",
    description: "A classic Galaga-style shooter game built with Base MiniApp SDK. Battle enemies, score points, and share your achievements on Farcaster!",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["game", "shooter", "galaga", "arcade", "gaming", "miniapp"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Classic arcade shooting action on Base",
    ogTitle: "Base Galaga - MiniApp Game",
    ogDescription: "Play the classic Galaga-style shooter game on Base MiniApp",
    ogImageUrl: `${ROOT_URL}/og-image.png`,
  },
} as const;

