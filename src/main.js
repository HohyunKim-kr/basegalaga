import Phaser from 'phaser';
import { MainMenu } from './scenes/MainMenu.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOver } from './scenes/GameOver.js';
import { Leaderboard } from './scenes/Leaderboard.js';

// Base MiniApp SDK
// SDK is injected by Base app at runtime via window.mini
// For local development, we use a fallback
let mini = null;

// Get Base MiniApp SDK from window (injected by Base app)
if (typeof window !== 'undefined' && window.mini) {
  mini = window.mini;
} else {
  // Fallback for local development
  console.warn('Base MiniApp SDK not available, using fallback mode');
  mini = {
    onReady: (callback) => {
      // Simulate ready state
      setTimeout(callback, 100);
    },
    auth: {
      connect: async () => {
        return { address: '0x0000000000000000000000000000000000000000' };
      }
    },
    storage: {
      get: async (key) => {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      set: async (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      remove: async (key) => {
        localStorage.removeItem(key);
      }
    },
    social: {
      share: async (options) => {
        console.log('Share:', options);
        alert(`Share: ${options.text}`);
      }
    }
  };
}

// Initialize Base MiniApp SDK
mini.onReady(() => {
  console.log('Base MiniApp SDK ready');
  
  // Optional: Connect wallet
  // mini.auth.connect().then(user => {
  //   console.log('Wallet connected:', user.address);
  // });
});

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.innerWidth <= 768 && 'ontouchstart' in window);

// Fixed resolution for consistent gameplay
// Use portrait mode for mobile, landscape for desktop
const BASE_WIDTH = isMobile ? 375 : 800;
const BASE_HEIGHT = isMobile ? 667 : 600;

// Phaser Game Configuration
const config = {
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [MainMenu, GameScene, GameOver, Leaderboard],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT
  },
  input: {
    activePointers: 3 // Support multiple touch points
  }
};

// Create and start the game
const game = new Phaser.Game(config);

// Export mini and isMobile for use in other modules
export { mini, isMobile };

