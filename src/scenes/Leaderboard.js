import Phaser from 'phaser';
import { scoreManager } from '../utils/score.js';
import { MODERN_COLORS, createModernTextStyle, createModernButton, createModernBackground, createModernGrid } from '../utils/modernStyle.js';
import { isMobile } from '../main.js';

export class Leaderboard extends Phaser.Scene {
  constructor() {
    super({ key: 'Leaderboard' });
    this.scores = [];
  }

  async create() {
    const { width, height } = this.cameras.main;

    // Modern gradient background
    createModernBackground(this, width, height);
    
    // Subtle grid overlay
    createModernGrid(this, width, height);

    // Title - Modern design
    const titleSize = isMobile ? 44 : 60;
    const title = this.add.text(width / 2, height * 0.08, 'LEADERBOARD', createModernTextStyle(titleSize, '#ffffff', '700'))
      .setOrigin(0.5);
    
    // Subtle title animation
    this.tweens.add({
      targets: title,
      alpha: { from: 0.9, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // Load scores
    this.scores = await scoreManager.getScores();

    if (this.scores.length === 0) {
      this.add.text(width / 2, height * 0.5, 'NO SCORES YET\nPlay the game to set a record', createModernTextStyle(isMobile ? 16 : 20, '#ffffff', '400'))
        .setOrigin(0.5)
        .setAlign('center');
    } else {
      // Header - Modern design
      const headerSize = isMobile ? 16 : 20;
      const headerY = isMobile ? height * 0.14 : height * 0.16;
      
      if (isMobile) {
        this.add.text(width * 0.12, headerY, 'RANK', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
        this.add.text(width * 0.35, headerY, 'SCORE', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
        this.add.text(width * 0.58, headerY, 'STG', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
        this.add.text(width * 0.78, headerY, 'TIME', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
      } else {
        this.add.text(width * 0.15, headerY, 'RANK', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
        this.add.text(width * 0.35, headerY, 'SCORE', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
        this.add.text(width * 0.55, headerY, 'STAGE', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
        this.add.text(width * 0.75, headerY, 'TIME', createModernTextStyle(headerSize, '#ffffff', '600'))
          .setOrigin(0.5);
      }

      // Display top scores - Modern design
      const startY = isMobile ? height * 0.20 : height * 0.22;
      const spacing = isMobile ? 30 : 38;
      const maxDisplay = Math.min(isMobile ? 9 : 10, this.scores.length);
      const textSize = isMobile ? 16 : 20;

      for (let i = 0; i < maxDisplay; i++) {
        const scoreData = this.scores[i];
        const y = startY + (i * spacing);
        const rank = i + 1;
        
        // Rank - all white
        const rankX = isMobile ? width * 0.12 : width * 0.15;
        this.add.text(rankX, y, `#${rank}`, createModernTextStyle(rank <= 3 ? textSize + 2 : textSize, '#ffffff', rank <= 3 ? '700' : '600'))
          .setOrigin(0.5);

        // Score - all white
        const scoreX = isMobile ? width * 0.35 : width * 0.35;
        const scoreText = isMobile && scoreData.score > 9999 
          ? `${(scoreData.score / 1000).toFixed(1)}K` 
          : scoreData.score.toLocaleString();
        this.add.text(scoreX, y, scoreText, createModernTextStyle(textSize, '#ffffff', '500'))
          .setOrigin(0.5);

        // Stage - all white
        const stage = scoreData.stage || 1;
        const stageX = isMobile ? width * 0.58 : width * 0.55;
        this.add.text(stageX, y, `S${stage}`, createModernTextStyle(textSize - 2, '#ffffff', '500'))
          .setOrigin(0.5);

        // Time - all white
        const time = scoreData.time || 0;
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const timeX = isMobile ? width * 0.78 : width * 0.75;
        this.add.text(timeX, y, timeStr, createModernTextStyle(textSize - 2, '#ffffff', '400'))
          .setOrigin(0.5);
      }
    }

    // Back Button - Modern design
    const btnWidth = isMobile ? width * 0.85 : Math.min(width * 0.5, 320);
    const btnHeight = isMobile ? 56 : 64;
    createModernButton(
      this,
      width / 2,
      height * 0.90,
      btnWidth,
      btnHeight,
      0x4a5568,
      'BACK TO MENU',
      () => {
        this.scene.start('MainMenu');
      }
    );
  }
}

