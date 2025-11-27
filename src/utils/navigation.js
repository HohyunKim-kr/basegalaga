/**
 * Navigation Utilities for Base App
 * Provides functions to navigate users through the Base app and to external links
 */

import { sdk } from '@farcaster/miniapp-sdk';

/**
 * Open an external URL in the client's in-app browser
 * @param {string} url - The URL to open
 */
export async function openUrl(url) {
  try {
    if (typeof sdk !== 'undefined' && sdk && sdk.actions && sdk.actions.openUrl) {
      await sdk.actions.openUrl(url);
      console.log('✅ Opened URL:', url);
    } else {
      // Fallback for browser environment
      window.open(url, '_blank');
      console.log('✅ Opened URL (fallback):', url);
    }
  } catch (error) {
    console.error('Error opening URL:', error);
    // Fallback
    window.open(url, '_blank');
  }
}

/**
 * Compose a cast (post) with optional text and embeds
 * @param {string} text - The text content of the cast
 * @param {string[]} embeds - Array of URLs to embed
 */
export async function composeCast(text, embeds = []) {
  try {
    if (typeof sdk !== 'undefined' && sdk && sdk.actions && sdk.actions.composeCast) {
      await sdk.actions.composeCast({
        text: text,
        embeds: embeds
      });
      console.log('✅ Cast composed:', text);
    } else {
      // Fallback for browser environment
      const shareText = embeds.length > 0 
        ? `${text}\n\n${embeds.join('\n')}`
        : text;
      console.log('Cast (fallback):', shareText);
      // Could also try to open Warpcast compose URL
      if (typeof window !== 'undefined') {
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
        window.open(warpcastUrl, '_blank');
      }
    }
  } catch (error) {
    console.error('Error composing cast:', error);
  }
}

/**
 * View a cast by URL
 * @param {string} castUrl - The URL of the cast to view
 */
export async function viewCast(castUrl) {
  try {
    if (typeof sdk !== 'undefined' && sdk && sdk.actions && sdk.actions.viewCast) {
      await sdk.actions.viewCast(castUrl);
      console.log('✅ Viewing cast:', castUrl);
    } else {
      // Fallback for browser environment
      window.open(castUrl, '_blank');
      console.log('✅ Viewing cast (fallback):', castUrl);
    }
  } catch (error) {
    console.error('Error viewing cast:', error);
    // Fallback
    window.open(castUrl, '_blank');
  }
}

/**
 * Open a group message conversation
 * @param {string} conversationId - The XMTP conversation ID
 */
export async function openGroupMessage(conversationId) {
  try {
    const deeplink = `cbwallet://messaging/${conversationId}`;
    await openUrl(deeplink);
    console.log('✅ Opening group message:', conversationId);
  } catch (error) {
    console.error('Error opening group message:', error);
  }
}

/**
 * Open a direct message with a user or agent
 * @param {string} address - The 0x address of the user or agent
 */
export async function openDirectMessage(address) {
  try {
    const deeplink = `cbwallet://messaging/${address}`;
    await openUrl(deeplink);
    console.log('✅ Opening direct message:', address);
  } catch (error) {
    console.error('Error opening direct message:', error);
  }
}

/**
 * Launch a mini app via deeplink
 * @param {string} miniAppUrl - The URL of the mini app to launch
 */
export async function launchMiniApp(miniAppUrl) {
  try {
    const deeplink = `cbwallet://miniapp?url=${encodeURIComponent(miniAppUrl)}`;
    await openUrl(deeplink);
    console.log('✅ Launching mini app:', miniAppUrl);
  } catch (error) {
    console.error('Error launching mini app:', error);
  }
}

// Export all functions
export default {
  openUrl,
  composeCast,
  viewCast,
  openGroupMessage,
  openDirectMessage,
  launchMiniApp
};

