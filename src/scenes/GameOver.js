import Phaser from 'phaser';
import { scoreManager } from '../utils/score.js';
import { CYBERPUNK_COLORS, createCyberpunkTextStyle, createCyberpunkButton, createScanlines } from '../utils/cyberpunkStyle.js';

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
    
    // Save score with all data
    if (this.finalScore > 0) {
      await scoreManager.saveScore(this.finalScore, this.baseScore, this.elapsedTime, this.stage);
    }
    
    // Get best score
    this.bestScore = await scoreManager.getBestScore();
  }

  create() {
    const { width, height } = this.cameras.main;

    // Cyberpunk gradient background
    const bg1 = this.add.rectangle(width / 2, 0, width, height / 3, CYBERPUNK_COLORS.bgDark);
    const bg2 = this.add.rectangle(width / 2, height / 3, width, height / 3, CYBERPUNK_COLORS.bgPurple);
    const bg3 = this.add.rectangle(width / 2, (height / 3) * 2, width, height / 3, CYBERPUNK_COLORS.bgBlue);
    
    // Scanline effect
    createScanlines(this, width, height);
    
    // Grid overlay
    this.createGridOverlay(width, height);

    // Game Over or All Cleared Text
    if (this.allCleared) {
      const title = this.add.text(width / 2, height * 0.12, '> ALL STAGES CLEARED <', {
        fontSize: '42px',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        color: CYBERPUNK_COLORS.textAccent,
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: CYBERPUNK_COLORS.textAccent,
          blur: 3,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      
      // Animated glow
      this.tweens.add({
        targets: title,
        alpha: { from: 0.7, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    } else {
      const title = this.add.text(width / 2, height * 0.12, '> GAME OVER <', {
        fontSize: '56px',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        color: CYBERPUNK_COLORS.textWarning,
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: CYBERPUNK_COLORS.textWarning,
          blur: 3,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      
      // Animated glow
      this.tweens.add({
        targets: title,
        alpha: { from: 0.7, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1
      });
    }

    // Stage reached
    this.add.text(width / 2, height * 0.22, `> STAGE REACHED: ${this.stage}/10 <`, createCyberpunkTextStyle(22, CYBERPUNK_COLORS.textPrimary))
      .setOrigin(0.5);

    // Time display
    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    this.add.text(width / 2, height * 0.28, `> TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} <`, createCyberpunkTextStyle(18, '#888888'))
      .setOrigin(0.5);

    // Score Display
    this.add.text(width / 2, height * 0.36, `> FINAL SCORE: ${this.finalScore.toLocaleString()} <`, {
      fontSize: '36px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: CYBERPUNK_COLORS.textPrimary,
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: CYBERPUNK_COLORS.textPrimary,
        blur: 3,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);

    if (this.baseScore !== this.finalScore) {
      this.add.text(width / 2, height * 0.43, `> BASE: ${this.baseScore.toLocaleString()} + TIME BONUS <`, createCyberpunkTextStyle(16, CYBERPUNK_COLORS.textSuccess))
        .setOrigin(0.5);
    }

    if (this.bestScore > 0) {
      this.add.text(width / 2, height * 0.42, `Best Score: ${this.bestScore}`, {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#00ff00'
      }).setOrigin(0.5);
    }

    // New Record indicator
    if (this.finalScore === this.bestScore && this.finalScore > 0) {
      const recordText = this.add.text(width / 2, height * 0.50, '> NEW RECORD! <', {
        fontSize: '32px',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        color: CYBERPUNK_COLORS.textAccent,
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: CYBERPUNK_COLORS.textAccent,
          blur: 3,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: recordText,
        scale: { from: 1, to: 1.1 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // Buttons with cyberpunk style
    const retryBtn = createCyberpunkButton(
      this,
      width / 2,
      height * 0.60,
      240,
      60,
      CYBERPUNK_COLORS.neonGreen,
      '> RETRY',
      () => {
        this.scene.start('GameScene');
      }
    );

    const shareBtn = createCyberpunkButton(
      this,
      width / 2,
      height * 0.70,
      240,
      60,
      CYBERPUNK_COLORS.neonCyan,
      '> SHARE TO FARCASTER',
      async () => {
        await this.shareToFarcaster();
      }
    );

    const leaderboardBtn = createCyberpunkButton(
      this,
      width / 2,
      height * 0.80,
      240,
      60,
      CYBERPUNK_COLORS.neonPurple,
      '> LEADERBOARD',
      () => {
        this.scene.start('Leaderboard');
      }
    );

    const menuBtn = createCyberpunkButton(
      this,
      width / 2,
      height * 0.90,
      240,
      60,
      0x666666,
      '> MAIN MENU',
      () => {
        this.scene.start('MainMenu');
      }
    );
  }

  async shareToFarcaster() {
    try {
      const mini = typeof window !== 'undefined' && window.mini ? window.mini : null;
      if (mini && mini.social) {
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        await mini.social.share({
          text: `🚀 Base Galaga Stage ${this.stage} 클리어! ${this.finalScore.toLocaleString()}점 (${timeStr}) 달성! 도전해보세요!`
        });
      } else {
        // Fallback for local development
        alert(`Share to Farcaster: ${this.finalScore}점 달성!`);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('공유 기능을 사용할 수 없습니다.');
    }
  }

  createGridOverlay(width, height) {
    const gridGroup = this.add.group();
    const gridColor = CYBERPUNK_COLORS.neonCyan;
    const gridAlpha = 0.05;
    const spacing = 100;

    for (let x = 0; x < width; x += spacing) {
      const line = this.add.line(x, height / 2, 0, -height / 2, 0, height / 2, gridColor, gridAlpha);
      gridGroup.add(line);
    }

    for (let y = 0; y < height; y += spacing) {
      const line = this.add.line(width / 2, y, -width / 2, 0, width / 2, 0, gridColor, gridAlpha);
      gridGroup.add(line);
    }
  }
}

