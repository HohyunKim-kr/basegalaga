import Phaser from 'phaser';
import { scoreManager } from '../utils/score.js';
import { MODERN_COLORS, createModernBackground, createModernGrid } from '../utils/modernStyle.js';
import { createRexButton, createRexLabel } from '../utils/rexUIHelper.js';
import { isMobile } from '../main.js';

export class Leaderboard extends Phaser.Scene {
  constructor() {
    super({ key: 'Leaderboard' });
    this.scores = [];
  }

  async create() {
    const { width, height } = this.cameras.main;

    // Phaser 입력 시스템 완전 비활성화 (DOM 이벤트만 사용)
    this.input.enabled = false;
    if (this.input.mouse) this.input.mouse.enabled = false;
    if (this.input.touch) this.input.touch.enabled = false;

    // Modern gradient background
    createModernBackground(this, width, height);
    
    // Subtle grid overlay
    createModernGrid(this, width, height);

    // Title - Rex UI
    const titleSize = isMobile ? 44 : 60;
    const title = createRexLabel(this, width / 2, height * 0.08, 'LEADERBOARD', {
      fontSize: titleSize,
      color: '#ffffff',
      backgroundColor: null
    });
    
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
      createRexLabel(this, width / 2, height * 0.5, 'NO SCORES YET\nPlay the game to set a record', {
        fontSize: isMobile ? 16 : 20,
        color: '#ffffff',
        backgroundColor: null
      });
    } else {
      // Header - Rex UI
      const headerSize = isMobile ? 16 : 20;
      const headerY = isMobile ? height * 0.14 : height * 0.16;
      
      if (isMobile) {
        createRexLabel(this, width * 0.12, headerY, 'RANK', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
        createRexLabel(this, width * 0.35, headerY, 'SCORE', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
        createRexLabel(this, width * 0.58, headerY, 'STG', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
        createRexLabel(this, width * 0.78, headerY, 'TIME', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
      } else {
        createRexLabel(this, width * 0.15, headerY, 'RANK', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
        createRexLabel(this, width * 0.35, headerY, 'SCORE', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
        createRexLabel(this, width * 0.55, headerY, 'STAGE', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
        createRexLabel(this, width * 0.75, headerY, 'TIME', { fontSize: headerSize, color: '#ffffff', backgroundColor: null });
      }

      // Display top scores - Rex UI
      const startY = isMobile ? height * 0.20 : height * 0.22;
      const spacing = isMobile ? 30 : 38;
      const maxDisplay = Math.min(isMobile ? 9 : 10, this.scores.length);
      const textSize = isMobile ? 16 : 20;

      for (let i = 0; i < maxDisplay; i++) {
        const scoreData = this.scores[i];
        const y = startY + (i * spacing);
        const rank = i + 1;
        
        // Rank
        const rankX = isMobile ? width * 0.12 : width * 0.15;
        createRexLabel(this, rankX, y, `#${rank}`, {
          fontSize: rank <= 3 ? textSize + 2 : textSize,
          color: rank <= 3 ? MODERN_COLORS.textAccent : '#ffffff',
          backgroundColor: null
        });

        // Score
        const scoreX = isMobile ? width * 0.35 : width * 0.35;
        const scoreText = isMobile && scoreData.score > 9999 
          ? `${(scoreData.score / 1000).toFixed(1)}K` 
          : scoreData.score.toLocaleString();
        createRexLabel(this, scoreX, y, scoreText, {
          fontSize: textSize,
          color: '#ffffff',
          backgroundColor: null
        });

        // Stage
        const stage = scoreData.stage || 1;
        const stageX = isMobile ? width * 0.58 : width * 0.55;
        createRexLabel(this, stageX, y, `S${stage}`, {
          fontSize: textSize - 2,
          color: '#ffffff',
          backgroundColor: null
        });

        // Time
        const time = scoreData.time || 0;
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const timeX = isMobile ? width * 0.78 : width * 0.75;
        createRexLabel(this, timeX, y, timeStr, {
          fontSize: textSize - 2,
          color: '#ffffff',
          backgroundColor: null
        });
      }
    }

    // Back Button - Rex UI
    const btnWidth = isMobile ? width * 0.85 : Math.min(width * 0.5, 320);
    const btnHeight = isMobile ? 56 : 64;
    createRexButton(
      this,
      width / 2,
      height * 0.90,
      btnWidth,
      btnHeight,
      'BACK TO MENU',
      () => {
        this.scene.start('MainMenu');
      },
      {
        backgroundColor: 0x4a5568,
        borderColor: 0x00ffff,
        textColor: '#ffffff',
        fontSize: isMobile ? 18 : 20
      }
    );
  }
}

