import Phaser from 'phaser';
import { MODERN_COLORS, createModernTextStyle, createModernButton, createModernBackground, createModernGrid } from '../utils/modernStyle.js';
import { isMobile } from '../main.js';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Modern gradient background
    createModernBackground(this, width, height);
    
    // Subtle grid overlay
    createModernGrid(this, width, height);

    // Title - Modern, clean design
    const titleSize = isMobile ? 48 : 64;
    const title = this.add.text(width / 2, height * 0.15, 'BASE GALAGA', createModernTextStyle(titleSize, '#ffffff', '700'))
      .setOrigin(0.5);

    // Subtle title animation
    this.tweens.add({
      targets: title,
      alpha: { from: 0.9, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle
    this.add.text(width / 2, height * 0.24, 'Modern Arcade Shooter', createModernTextStyle(isMobile ? 16 : 20, '#ffffff', '400'))
      .setOrigin(0.5);

    // Buttons - Modern design
    const btnWidth = isMobile ? width * 0.85 : Math.min(width * 0.5, 320);
    const btnHeight = isMobile ? 56 : 64;
    const btnSpacing = isMobile ? 60 : 72;
    let btnY = isMobile ? height * 0.40 : height * 0.42;
    
    const startBtn = createModernButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      MODERN_COLORS.buttonPrimary,
      'START GAME',
      () => {
        this.scene.start('GameScene');
      }
    );

    btnY += btnSpacing;
    const leaderboardBtn = createModernButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      MODERN_COLORS.buttonSecondary,
      'LEADERBOARD',
      () => {
        this.scene.start('Leaderboard');
      }
    );

    // Instructions
    const instructionText = isMobile ? 'Tap to play' : 'Arrow Keys: Move | Space: Shoot';
    this.add.text(width / 2, height * 0.80, instructionText, createModernTextStyle(isMobile ? 12 : 14, '#ffffff', '400'))
      .setOrigin(0.5);

    // Version info
    this.add.text(width / 2, height * 0.92, 'v1.0.0 • Base MiniApp', createModernTextStyle(isMobile ? 10 : 12, '#ffffff', '400'))
      .setOrigin(0.5);
  }
}

