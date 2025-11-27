import Phaser from 'phaser';
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { sdk } from '@farcaster/miniapp-sdk';
import { MainMenu } from './scenes/MainMenu.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOver } from './scenes/GameOver.js';
import { Leaderboard } from './scenes/Leaderboard.js';
import { GameSummaryScene } from './scenes/GameSummaryScene.js';

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

// Get Farcaster user information
async function getFarcasterUser() {
  try {
    if (typeof sdk !== 'undefined' && sdk && sdk.context) {
      const context = await sdk.context;
      const user = context?.user;

      if (user && user.fid) {
        return {
          fid: user.fid,
          username: user.username || '',
          displayName: user.displayName || '',
          pfpUrl: user.pfpUrl || ''
        };
      }
    }
  } catch (error) {
    console.warn('Error getting Farcaster user:', error);
  }

  return null;
}

// Expose getFarcasterUser globally
if (typeof window !== 'undefined') {
  window.getFarcasterUser = getFarcasterUser;
}

// Initialize DOM-based user header
import { initUserHeader } from './utils/domUserHeader.js';
initUserHeader();

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (window.innerWidth <= 768 && 'ontouchstart' in window);

// Fully responsive - use actual viewport dimensions
// This ensures the game fills the entire screen on any device
const BASE_WIDTH = window.innerWidth || (isMobile ? 375 : 800);
const BASE_HEIGHT = window.innerHeight || (isMobile ? 667 : 600);

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
  plugins: {
    scene: [
      {
        key: 'rexUI',
        plugin: UIPlugin,
        mapping: 'rexUI'
      }
    ]
  },
  scene: [MainMenu, GameScene, GameOver, Leaderboard, GameSummaryScene],
  scale: {
    mode: Phaser.Scale.RESIZE, // Fully responsive - resizes with window
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    // Handle window resize
    resizeInterval: 100
  },
  input: {
    activePointers: 3,
    keyboard: true,
    touch: true,
    mouse: true
  }
};

// Create and start the game
const game = new Phaser.Game(config);

// Phaser Input System - Keep enabled for UI scenes
game.events.once('ready', () => {
  console.log('✅ Game Ready - Input System Active');
});

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
export { mini, isMobile, getFarcasterUser };

