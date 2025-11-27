import Phaser from 'phaser';
import { sdk } from '@farcaster/miniapp-sdk';
import { scoreManager } from '../utils/score.js';
import {
  PREMIUM_COLORS,
  PREMIUM_FONTS,
  createPremiumBackground,
  createGlassPanel
} from '../utils/premiumStyle.js';
import { createRexButton } from '../utils/rexUIHelper.js';
import { createUserHeader } from '../utils/userHeader.js';
import { isMobile } from '../main.js';

export class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
    this.finalScore = 0;
    this.bestScore = 0;
  }

  async init(data) {
    this.finalScore = data.score || 0;
    this.baseScore = data.baseScore || this.finalScore;
    this.elapsedTime = data.time || 0;
    this.stage = data.stage || 1;
    this.allCleared = data.allCleared || false;
    this.summaryText = data.summaryText || null; // GameSummary에서 전달된 요약 텍스트

    // Save score
    if (this.finalScore > 0) {
      scoreManager.saveScore(this.finalScore, this.baseScore, this.elapsedTime, this.stage)
        .catch(err => console.error('Error saving score:', err));
    }

    // Get best score
    try {
      this.bestScore = await scoreManager.getBestScore();
    } catch (err) {
      this.bestScore = 0;
    }
  }

  create() {
    const { width, height } = this.cameras.main;

    // CRITICAL: Ensure input system is enabled for this scene
    if (this.input) {
      this.input.enabled = true;
      if (this.input.mouse) this.input.mouse.enabled = true;
      if (this.input.touch) this.input.touch.enabled = true;
    }
    console.log('GameOver scene - Input enabled:', this.input?.enabled);

    // 1. Premium Background
    createPremiumBackground(this, width, height);

    // 2. Title (Mission Failed / Victory)
    this.createTitle(width, height);

    // 3. Stats Panel
    this.createStatsPanel(width, height);

    // 4. Action Buttons
    this.createButtons(width, height);
  }

  createTitle(width, height) {
    const titleText = this.allCleared ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED';
    // Helper to convert hex number to string
    const toColorStr = (color) => '#' + color.toString(16).padStart(6, '0');
    const titleColor = this.allCleared ? toColorStr(PREMIUM_COLORS.neonCyan) : toColorStr(PREMIUM_COLORS.neonRed);

    const title = this.add.text(width / 2, height * 0.15, titleText, {
      fontFamily: PREMIUM_FONTS.header,
      fontSize: isMobile ? '36px' : '56px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: titleColor,
      strokeThickness: 2,
      shadow: { blur: 20, color: titleColor, fill: true }
    }).setOrigin(0.5);
    title.setDepth(50); // Above background but below buttons
    title.disableInteractive(); // Don't block button clicks

    // Pulse animation
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      alpha: { from: 0.9, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createStatsPanel(width, height) {
    const panelY = height * 0.35;
    const panelHeight = isMobile ? 200 : 250;
    const panelWidth = Math.min(width * 0.85, 400);

    // Glass Panel
    createGlassPanel(this, width / 2, panelY, panelWidth, panelHeight);

    // Helper to convert hex number to string
    const toColorStr = (color) => '#' + color.toString(16).padStart(6, '0');

    // Score Label
    const scoreLabel = this.add.text(width / 2, panelY - 60, 'FINAL SCORE', {
      fontFamily: PREMIUM_FONTS.body,
      fontSize: '16px',
      color: toColorStr(PREMIUM_COLORS.uiTextDim),
      letterSpacing: 2
    }).setOrigin(0.5);
    scoreLabel.setDepth(100); // Above panel
    scoreLabel.disableInteractive();

    // Score Value (Animated)
    const scoreText = this.add.text(width / 2, panelY - 20, '0', {
      fontFamily: PREMIUM_FONTS.header,
      fontSize: isMobile ? '48px' : '64px',
      color: toColorStr(PREMIUM_COLORS.neonGold),
      shadow: { blur: 15, color: toColorStr(PREMIUM_COLORS.neonGold), fill: true }
    }).setOrigin(0.5);
    scoreText.setDepth(100);
    scoreText.disableInteractive();

    // Animate Score Counting
    this.tweens.addCounter({
      from: 0,
      to: this.finalScore,
      duration: 1500,
      ease: 'Power2',
      onUpdate: (tween) => {
        scoreText.setText(Math.floor(tween.getValue()).toLocaleString());
      }
    });

    // Stage & Time
    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const stageTime = this.add.text(width / 2, panelY + 40, `STAGE ${this.stage} • TIME ${timeStr}`, {
      fontFamily: PREMIUM_FONTS.body,
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    stageTime.setDepth(100);
    stageTime.disableInteractive();

    // New Record
    if (this.finalScore > 0 && this.finalScore >= this.bestScore) {
      const newRecord = this.add.text(width / 2, panelY + 80, 'NEW RECORD!', {
        fontFamily: PREMIUM_FONTS.header,
        fontSize: '24px',
        color: toColorStr(PREMIUM_COLORS.neonCyan),
        fontStyle: 'bold'
      }).setOrigin(0.5);
      newRecord.setDepth(100);
      newRecord.disableInteractive();

      this.tweens.add({
        targets: newRecord,
        scale: { from: 1, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
  }

  createButtons(width, height) {
    console.log('[GameOver] Creating buttons with RexUI...');

    const startY = height * 0.65;
    const spacing = 70;
    const btnWidth = Math.min(width * 0.8, 320);
    const btnHeight = 60;

    // Share (Broadcast Score)
    const { button: shareBtn } = createRexButton(
      this,
      width / 2,
      startY,
      btnWidth,
      btnHeight,
      'BROADCAST SCORE',
      () => {
        console.log('BROADCAST SCORE clicked');
        this.shareToFarcaster();
      }
    );
    shareBtn.setDepth(10000);

    // Leaderboard
    const { button: leaderboardBtn } = createRexButton(
      this,
      width / 2,
      startY + spacing,
      btnWidth,
      btnHeight,
      'LEADERBOARD',
      () => {
        console.log('LEADERBOARD clicked');
        this.scene.start('Leaderboard');
      }
    );
    leaderboardBtn.setDepth(10000);

    // Menu
    const { button: menuBtn } = createRexButton(
      this,
      width / 2,
      startY + spacing * 2,
      btnWidth,
      btnHeight,
      'ABORT TO MENU',
      () => {
        console.log('ABORT TO MENU clicked');
        this.scene.start('MainMenu');
      }
    );
    menuBtn.setDepth(10000);

    console.log('[GameOver] All RexUI buttons created');
  }

  async shareToFarcaster() {
    try {
      // GameSummary 텍스트가 있으면 사용, 없으면 기본 메시지 생성
      let shareText = '';
      
      if (this.summaryText && this.summaryText.trim() !== '') {
        // GameSummary 텍스트 사용
        shareText = this.summaryText.trim();
      } else {
        // 폴백: 기본 메시지 생성
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        shareText = `🚀 Base Galaga Mission Report:\nScore: ${this.finalScore.toLocaleString()}\nStage: ${this.stage}\nTime: ${timeStr}\n\nCan you beat my score?`;
      }
      
      // 초대 링크 추가
      const inviteLink = '\n\n🎮 Play now: basegalaga.vercel.app';
      shareText += inviteLink;

      // Use Farcaster SDK composeCast action
      if (sdk && sdk.actions && sdk.actions.composeCast) {
        await sdk.actions.composeCast({
          text: shareText
        });
      } else {
        // Fallback for development/testing
        console.log('SDK composeCast not available, using fallback');
        alert(`Share: ${shareText}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert(`Error sharing score: ${error.message}`);
    }
  }
}
