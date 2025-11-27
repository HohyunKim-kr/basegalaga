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

// Notification details storage
let notificationDetails = null;

// Initialize SDK event listeners
function initializeSDKEvents() {
  try {
    if (typeof sdk !== 'undefined' && sdk) {
      // SDK는 emitter를 스프레드하므로 직접 on 메서드를 사용
      // Listen for miniAppAdded event (camelCase)
      if (sdk.on) {
        sdk.on('miniAppAdded', (payload) => {
          console.log('✅ Mini App added:', payload);
          if (payload && payload.notificationDetails) {
            notificationDetails = {
              url: payload.notificationDetails.url,
              token: payload.notificationDetails.token
            };
            // Update global reference
            if (typeof window !== 'undefined') {
              window.notificationDetails = notificationDetails;
            }
            // Save to storage for persistence
            if (mini && mini.storage) {
              mini.storage.set('notificationDetails', notificationDetails)
                .then(() => console.log('✅ Notification details saved'))
                .catch(err => console.warn('Failed to save notification details:', err));
            }
            console.log('Notification details:', notificationDetails);
          }
        });

        // Listen for miniAppRemoved event
        sdk.on('miniAppRemoved', () => {
          console.log('⚠️ Mini App removed');
          // Invalidate notification tokens
          notificationDetails = null;
          if (typeof window !== 'undefined') {
            window.notificationDetails = null;
          }
          if (mini && mini.storage) {
            mini.storage.remove('notificationDetails')
              .then(() => console.log('✅ Notification details removed'))
              .catch(err => console.warn('Failed to remove notification details:', err));
          }
        });

        // Listen for notificationsEnabled event
        sdk.on('notificationsEnabled', (payload) => {
          console.log('✅ Notifications enabled:', payload);
          if (payload && payload.notificationDetails) {
            notificationDetails = {
              url: payload.notificationDetails.url,
              token: payload.notificationDetails.token
            };
            // Update global reference
            if (typeof window !== 'undefined') {
              window.notificationDetails = notificationDetails;
            }
            // Save to storage
            if (mini && mini.storage) {
              mini.storage.set('notificationDetails', notificationDetails)
                .then(() => console.log('✅ Notification details updated'))
                .catch(err => console.warn('Failed to save notification details:', err));
            }
          }
        });

        // Listen for notificationsDisabled event
        sdk.on('notificationsDisabled', () => {
          console.log('⚠️ Notifications disabled');
          // Invalidate notification tokens
          notificationDetails = null;
          if (typeof window !== 'undefined') {
            window.notificationDetails = null;
          }
          if (mini && mini.storage) {
            mini.storage.remove('notificationDetails')
              .then(() => console.log('✅ Notification details removed'))
              .catch(err => console.warn('Failed to remove notification details:', err));
          }
        });

        console.log('✅ SDK event listeners initialized');
      } else {
        console.warn('SDK.on method not available');
      }
    } else {
      console.warn('SDK not available');
    }
  } catch (error) {
    console.warn('Error initializing SDK events:', error);
  }
}

// Load saved notification details on startup
async function loadNotificationDetails() {
  try {
    if (mini && mini.storage) {
      const saved = await mini.storage.get('notificationDetails');
      if (saved && saved.url && saved.token) {
        notificationDetails = saved;
        // Update global reference
        if (typeof window !== 'undefined') {
          window.notificationDetails = notificationDetails;
        }
        console.log('✅ Loaded saved notification details');
      }
    }
  } catch (error) {
    console.warn('Error loading notification details:', error);
  }
}

// Initialize events after SDK is ready
async function setupSDKEvents() {
  // Wait a bit for SDK to be fully initialized
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (typeof sdk !== 'undefined' && sdk) {
    // Initialize event listeners
    initializeSDKEvents();
    
    // Load saved notification details
    await loadNotificationDetails();
  }
}

// Setup events
setupSDKEvents();

// Expose notification details getter
function getNotificationDetails() {
  return notificationDetails;
}

// Send notification using stored details
async function sendNotification(title, body, targetUrl = null) {
  try {
    if (!notificationDetails || !notificationDetails.url || !notificationDetails.token) {
      console.warn('Notification details not available');
      return false;
    }

    const response = await fetch(notificationDetails.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${notificationDetails.token}`
      },
      body: JSON.stringify({
        title: title,
        body: body,
        targetUrl: targetUrl || window.location.origin
      })
    });

    if (response.ok) {
      console.log('✅ Notification sent successfully');
      return true;
    } else {
      console.warn('Failed to send notification:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getNotificationDetails = getNotificationDetails;
  window.sendNotification = sendNotification;
  window.notificationDetails = notificationDetails;
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
export { mini, isMobile, getFarcasterUser, getNotificationDetails, sendNotification };

