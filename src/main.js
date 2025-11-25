import Phaser from 'phaser';
import { sdk } from '@farcaster/miniapp-sdk';
import { MainMenu } from './scenes/MainMenu.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOver } from './scenes/GameOver.js';
import { Leaderboard } from './scenes/Leaderboard.js';

// Base MiniApp SDK - using official @farcaster/miniapp-sdk
// Create compatibility wrapper for existing code
let mini = null;

// Initialize SDK wrapper
try {
  // Check if SDK is available (in Base app environment)
  if (typeof sdk !== 'undefined' && sdk) {
    mini = {
      onReady: (callback) => {
        // SDK is ready, call immediately
        if (callback) callback();
      },
      auth: {
        connect: async () => {
          try {
            // Use SDK's connectWallet if available
            if (sdk.actions && sdk.actions.connectWallet) {
              const user = await sdk.actions.connectWallet();
              return { address: user?.address || '0x0000000000000000000000000000000000000000' };
            }
            return { address: '0x0000000000000000000000000000000000000000' };
          } catch (error) {
            console.warn('Wallet connect error:', error);
            return { address: '0x0000000000000000000000000000000000000000' };
          }
        }
      },
      storage: {
        get: async (key) => {
          try {
            if (sdk.storage && sdk.storage.get) {
              return await sdk.storage.get(key);
            }
            // Fallback
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.warn('Storage get error:', error);
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
          }
        },
        set: async (key, value) => {
          try {
            if (sdk.storage && sdk.storage.set) {
              await sdk.storage.set(key, value);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          } catch (error) {
            console.warn('Storage set error:', error);
            localStorage.setItem(key, JSON.stringify(value));
          }
        },
        remove: async (key) => {
          try {
            if (sdk.storage && sdk.storage.remove) {
              await sdk.storage.remove(key);
            } else {
              localStorage.removeItem(key);
            }
          } catch (error) {
            console.warn('Storage remove error:', error);
            localStorage.removeItem(key);
          }
        }
      },
      social: {
        share: async (options) => {
          try {
            // Use SDK's share or openUrl if available
            if (sdk.actions && sdk.actions.openUrl) {
              await sdk.actions.openUrl({ 
                url: `https://warpcast.com/~/compose?text=${encodeURIComponent(options.text)}` 
              });
            } else {
              alert(`Share: ${options.text}`);
            }
          } catch (error) {
            console.warn('Share error:', error);
            alert(`Share: ${options.text}`);
          }
        }
      }
    };
  } else {
    throw new Error('SDK not available');
  }
} catch (error) {
  console.warn('SDK initialization error, using fallback:', error);
  // Fallback for local development
  mini = {
    onReady: (callback) => {
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

// Expose as window.mini for compatibility
if (typeof window !== 'undefined') {
  window.mini = mini;
}

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

// Once app is ready to be displayed, call sdk.actions.ready()
// This hides the loading splash screen
// Wait for game to fully initialize before calling ready()
setTimeout(async () => {
  try {
    if (typeof sdk !== 'undefined' && sdk && sdk.actions && sdk.actions.ready) {
      await sdk.actions.ready();
      console.log('✅ App ready and displayed');
    } else {
      console.warn('SDK not available, skipping ready()');
    }
  } catch (error) {
    console.warn('SDK ready error (non-fatal):', error);
  }
}, 1000);

// Export mini and isMobile for use in other modules
export { mini, isMobile };

