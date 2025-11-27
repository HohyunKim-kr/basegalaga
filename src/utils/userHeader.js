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

        // Avatar circle (left side)
        const avatarX = padding + 20;
        const avatarY = headerHeight / 2;
        const avatar = scene.add.circle(avatarX, avatarY, 15, PREMIUM_COLORS.neonCyan, 0.3);
        avatar.setStrokeStyle(2, PREMIUM_COLORS.neonCyan, 1);
        avatar.setDepth(10000);
        avatar.setScrollFactor(0);
        avatar.disableInteractive();

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
