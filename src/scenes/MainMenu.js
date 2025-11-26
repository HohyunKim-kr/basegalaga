import Phaser from 'phaser';
import { MODERN_COLORS, createModernBackground, createModernGrid } from '../utils/modernStyle.js';
import { createRexButton, createRexLabel } from '../utils/rexUIHelper.js';
import { isMobile } from '../main.js';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Phaser 입력 시스템 완전 비활성화 (DOM 이벤트만 사용)
    this.input.enabled = false;
    if (this.input.mouse) this.input.mouse.enabled = false;
    if (this.input.touch) this.input.touch.enabled = false;

    // Modern gradient background
    createModernBackground(this, width, height);
    
    // Subtle grid overlay
    createModernGrid(this, width, height);

    // Title - Rex UI로 생성
    const titleSize = isMobile ? 52 : 72;
    const title = createRexLabel(this, width / 2, height * 0.15, 'BASE GALAGA', {
      fontSize: titleSize,
      color: MODERN_COLORS.textAccent,
      backgroundColor: null
    });

    // 타이틀 글로우 애니메이션
    this.tweens.add({
      targets: title,
      alpha: { from: 0.9, to: 1 },
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle - Rex UI로 생성
    const subtitle = createRexLabel(this, width / 2, height * 0.24, 'Modern Arcade Shooter', {
      fontSize: isMobile ? 18 : 22,
      color: '#ffffff',
      backgroundColor: null
    });
    subtitle.setAlpha(0.9);
    
    // 서브타이틀 펄스 애니메이션
    this.tweens.add({
      targets: subtitle,
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Buttons - Rex UI로 생성, 아래쪽 배치
    const btnWidth = isMobile ? width * 0.85 : Math.min(width * 0.5, 320);
    const btnHeight = isMobile ? 56 : 64;
    const btnSpacing = isMobile ? 60 : 72;
    let btnY = isMobile ? height * 0.60 : height * 0.65;
    
    const startBtn = createRexButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      'START GAME',
      () => {
        this.scene.start('GameScene');
      },
      {
        backgroundColor: 0x1a2a3a,
        borderColor: 0x00ffff,
        textColor: '#ffffff',
        fontSize: isMobile ? 18 : 20
      }
    );

    btnY += btnSpacing;
    const leaderboardBtn = createRexButton(
      this,
      width / 2,
      btnY,
      btnWidth,
      btnHeight,
      'LEADERBOARD',
      () => {
        this.scene.start('Leaderboard');
      },
      {
        backgroundColor: 0x1a2a3a,
        borderColor: 0x00ffff,
        textColor: '#ffffff',
        fontSize: isMobile ? 18 : 20
      }
    );

    // Instructions
    const instructionText = createRexLabel(this, width / 2, btnY + btnSpacing * 0.5, 'Tap buttons to play', {
      fontSize: isMobile ? 13 : 15,
      color: MODERN_COLORS.textSecondary,
      backgroundColor: null
    });
    instructionText.setAlpha(0.8);

    // Version info
    const versionText = createRexLabel(this, width / 2, height * 0.92, 'v1.0.0 • Base MiniApp', {
      fontSize: isMobile ? 10 : 12,
      color: MODERN_COLORS.textMuted,
      backgroundColor: null
    });
    versionText.setAlpha(0.6);
  }
}

