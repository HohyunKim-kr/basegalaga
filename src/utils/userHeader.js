/**
 * User Header Component
 * Displays user identity in a header bar across all scenes
 */
import { PREMIUM_COLORS, PREMIUM_FONTS } from './premiumStyle.js';

/**
 * Create a user header bar at the top of the scene
 * @param {Phaser.Scene} scene - The scene to add the header to
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 */
export async function createUserHeader(scene, width, height) {
    try {
        // Get Farcaster user info
        const getFarcasterUser = window.getFarcasterUser;
        if (!getFarcasterUser) {
            console.log('getFarcasterUser not available');
            return null;
        }

        const user = await getFarcasterUser();
        if (!user || !user.fid) {
            console.log('No user data available');
            return null;
        }

        const headerHeight = 50;
        const padding = 15;

        // Header background bar
        const headerBg = scene.add.rectangle(width / 2, headerHeight / 2, width, headerHeight, PREMIUM_COLORS.bgDark, 0.9);
        headerBg.setDepth(9999);
        headerBg.setScrollFactor(0);
        headerBg.disableInteractive();

        // Bottom border line
        const borderLine = scene.add.rectangle(width / 2, headerHeight, width, 2, PREMIUM_COLORS.neonCyan, 0.5);
        borderLine.setDepth(9999);
        borderLine.setScrollFactor(0);
        borderLine.disableInteractive();

        // Avatar circle (left side) - with profile picture if available
        const avatarX = padding + 20;
        const avatarY = headerHeight / 2;
        const avatarRadius = 15;
        
        // Create base avatar circle
        const avatar = scene.add.circle(avatarX, avatarY, avatarRadius, PREMIUM_COLORS.neonCyan, 0.3);
        avatar.setStrokeStyle(2, PREMIUM_COLORS.neonCyan, 1);
        avatar.setDepth(10000);
        avatar.setScrollFactor(0);
        avatar.disableInteractive();
        
        // Add initial text (will be replaced if image loads)
        const initial = (user.displayName || user.username || 'U').charAt(0).toUpperCase();
        const initialText = scene.add.text(avatarX, avatarY, initial, {
            fontFamily: PREMIUM_FONTS.body,
            fontSize: '12px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        initialText.setDepth(10001);
        initialText.setScrollFactor(0);
        initialText.disableInteractive();
        
        // Try to load profile picture if available
        if (user.pfpUrl && user.pfpUrl.trim() !== '') {
            // Load image dynamically
            scene.load.image(`pfp_${user.fid}`, user.pfpUrl);
            scene.load.once('filecomplete-image-pfp_' + user.fid, () => {
                try {
                    // Create image sprite
                    const pfpImage = scene.add.image(avatarX, avatarY, `pfp_${user.fid}`);
                    pfpImage.setDisplaySize(avatarRadius * 2, avatarRadius * 2);
                    
                    // Create circular mask
                    const mask = scene.make.graphics();
                    mask.fillStyle(0xffffff);
                    mask.fillCircle(avatarX, avatarY, avatarRadius);
                    pfpImage.setMask(mask.createGeometryMask());
                    
                    // Hide initial text and circle background
                    initialText.setVisible(false);
                    avatar.setFillStyle(0x000000, 0);
                    
                    pfpImage.setDepth(10000);
                    pfpImage.setScrollFactor(0);
                    pfpImage.disableInteractive();
                } catch (error) {
                    console.warn('Error displaying profile picture:', error);
                    // Keep fallback visible
                }
            });
            scene.load.once('loaderror', () => {
                console.warn('Failed to load profile picture, using fallback');
                // Keep fallback visible
            });
            scene.load.start();
        }

        // Display Name
        const displayName = user.displayName || user.username || `FID: ${user.fid}`;
        const nameText = scene.add.text(avatarX + 25, avatarY - 8, displayName, {
            fontFamily: PREMIUM_FONTS.body,
            fontSize: '14px',
            color: '#ffffff',
            fontWeight: 'bold'
        });
        nameText.setDepth(10000);
        nameText.setScrollFactor(0);
        nameText.disableInteractive();

        // Username (if different from displayName)
        if (user.username && user.username !== displayName) {
            const usernameText = scene.add.text(avatarX + 25, avatarY + 6, `@${user.username}`, {
                fontFamily: PREMIUM_FONTS.body,
                fontSize: '11px',
                color: PREMIUM_COLORS.neonGold
            });
            usernameText.setDepth(10000);
            usernameText.setScrollFactor(0);
            usernameText.disableInteractive();
        }

        // FID badge (right side)
        const fidText = scene.add.text(width - padding, avatarY, `FID: ${user.fid}`, {
            fontFamily: PREMIUM_FONTS.body,
            fontSize: '12px',
            color: PREMIUM_COLORS.uiTextDim,
            fontWeight: 'bold'
        }).setOrigin(1, 0.5);
        fidText.setDepth(10000);
        fidText.setScrollFactor(0);
        fidText.disableInteractive();

        console.log('✅ User header created:', user);

        return {
            headerBg,
            borderLine,
            avatar,
            nameText,
            fidText,
            headerHeight
        };
    } catch (error) {
        console.warn('Error creating user header:', error);
        return null;
    }
}
