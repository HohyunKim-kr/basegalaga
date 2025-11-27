import Phaser from 'phaser';
import {
  PREMIUM_COLORS,
  PREMIUM_FONTS,
  createPremiumBackground,
  createHolographicButton
} from '../utils/premiumStyle.js';
import { createUserHeader } from '../utils/userHeader.js';
import { isMobile } from '../main.js';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // CRITICAL: Ensure input system is enabled for this scene
    if (this.input) {
      this.input.enabled = true;
      if (this.input.mouse) this.input.mouse.enabled = true;
      if (this.input.touch) this.input.touch.enabled = true;
    }
    console.log('MainMenu scene - Input enabled:', this.input?.enabled);

    // 1. Premium Background
    createPremiumBackground(this, width, height);

    // 2. Animated Title
    this.createTitle(width, height);

    // 3. Menu Buttons
    this.createMenuButtons(width, height);

    // 4. Footer / Version
    const versionStyle = {
      fontSize: '14px',
      fontFamily: PREMIUM_FONTS.body,
      color: '#ffffff',
      alpha: 0.5
    };
    this.add.text(width / 2, height - 30, 'v1.0.0 • SYSTEM READY', versionStyle)
      .setOrigin(0.5)
      .setAlpha(0.5);
  }

  createTitle(width, height) {
    const titleY = height * 0.25;

    // Main Title "BASE"
    const titleText1 = this.add.text(width / 2, titleY - 40, 'BASE', {
      fontFamily: PREMIUM_FONTS.header,
      fontSize: isMobile ? '48px' : '72px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: PREMIUM_COLORS.neonMagenta,
      strokeThickness: 2,
      shadow: { blur: 20, color: PREMIUM_COLORS.neonMagenta, fill: true }
    }).setOrigin(0.5);

    // Main Title "GALAGA"
    const titleText2 = this.add.text(width / 2, titleY + 40, 'GALAGA', {
      fontFamily: PREMIUM_FONTS.header,
      fontSize: isMobile ? '64px' : '96px',
      fontStyle: '900', // Black weight
      color: '#ffffff',
      stroke: PREMIUM_COLORS.neonCyan,
      strokeThickness: 4,
      shadow: { blur: 30, color: PREMIUM_COLORS.neonCyan, fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, titleY + 100, 'TACTICAL SPACE SUPERIORITY', {
      fontFamily: PREMIUM_FONTS.body,
      fontSize: '16px',
      letterSpacing: 4,
      color: '#00f260',
      shadow: { blur: 5, color: '#00f260', fill: true }
    }).setOrigin(0.5);

    // Float Animation
    this.tweens.add({
      targets: [titleText1, titleText2],
      y: '+=10',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createMenuButtons(width, height) {
    const startY = height * 0.6;
    const spacing = 80;
    const btnWidth = Math.min(width * 0.8, 300);
    const btnHeight = 60;

    // Start Game
    createHolographicButton(
      this,
      width / 2,
      startY,
      btnWidth,
      btnHeight,
      'INITIATE LAUNCH',
      () => this.scene.start('GameScene')
    );

    // Leaderboard
    createHolographicButton(
      this,
      width / 2,
      startY + spacing,
      btnWidth,
      btnHeight,
      'HALL OF FAME',
      () => this.scene.start('Leaderboard')
    );
  }
}
