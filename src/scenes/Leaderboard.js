import Phaser from 'phaser';
import { scoreManager } from '../utils/score.js';
import { CYBERPUNK_COLORS, createCyberpunkTextStyle, createCyberpunkButton, createScanlines } from '../utils/cyberpunkStyle.js';

export class Leaderboard extends Phaser.Scene {
  constructor() {
    super({ key: 'Leaderboard' });
    this.scores = [];
  }

  async create() {
    const { width, height } = this.cameras.main;

    // Cyberpunk gradient background
    const bg1 = this.add.rectangle(width / 2, 0, width, height / 3, CYBERPUNK_COLORS.bgDark);
    const bg2 = this.add.rectangle(width / 2, height / 3, width, height / 3, CYBERPUNK_COLORS.bgPurple);
    const bg3 = this.add.rectangle(width / 2, (height / 3) * 2, width, height / 3, CYBERPUNK_COLORS.bgBlue);
    
    // Scanline effect
    createScanlines(this, width, height);
    
    // Grid overlay
    this.createGridOverlay(width, height);

    // Title
    const title = this.add.text(width / 2, height * 0.08, '> LEADERBOARD <', {
      fontSize: '48px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: CYBERPUNK_COLORS.textPrimary,
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: CYBERPUNK_COLORS.textPrimary,
        blur: 3,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Animated title glow
    this.tweens.add({
      targets: title,
      alpha: { from: 0.8, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Load scores
    this.scores = await scoreManager.getScores();

    if (this.scores.length === 0) {
      this.add.text(width / 2, height * 0.5, '> NO SCORES YET <\n> PLAY THE GAME TO SET A RECORD <', {
        fontSize: '22px',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        color: '#888888',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    } else {
      // Header
      this.add.text(width * 0.15, height * 0.16, '> RANK', createCyberpunkTextStyle(16, CYBERPUNK_COLORS.textSuccess))
        .setOrigin(0.5);
      
      this.add.text(width * 0.35, height * 0.16, '> SCORE', createCyberpunkTextStyle(16, CYBERPUNK_COLORS.textPrimary))
        .setOrigin(0.5);
      
      this.add.text(width * 0.55, height * 0.16, '> STAGE', createCyberpunkTextStyle(16, CYBERPUNK_COLORS.textAccent))
        .setOrigin(0.5);
      
      this.add.text(width * 0.75, height * 0.16, '> TIME', createCyberpunkTextStyle(16, CYBERPUNK_COLORS.textPrimary))
        .setOrigin(0.5);

      // Display top scores
      const startY = height * 0.22;
      const spacing = 32;
      const maxDisplay = Math.min(10, this.scores.length);

      for (let i = 0; i < maxDisplay; i++) {
        const scoreData = this.scores[i];
        const y = startY + (i * spacing);
        const rank = i + 1;
        
        // Rank
        const rankColor = rank === 1 ? CYBERPUNK_COLORS.textAccent : 
                         rank === 2 ? '#c0c0c0' : 
                         rank === 3 ? '#cd7f32' : 
                         CYBERPUNK_COLORS.textPrimary;
        this.add.text(width * 0.15, y, `#${rank}`, createCyberpunkTextStyle(rank <= 3 ? 20 : 18, rankColor))
          .setOrigin(0.5);

        // Score
        this.add.text(width * 0.35, y, scoreData.score.toLocaleString(), createCyberpunkTextStyle(18, CYBERPUNK_COLORS.textPrimary))
          .setOrigin(0.5);

        // Stage
        const stage = scoreData.stage || 1;
        this.add.text(width * 0.55, y, `S${stage}`, createCyberpunkTextStyle(16, CYBERPUNK_COLORS.textAccent))
          .setOrigin(0.5);

        // Time
        const time = scoreData.time || 0;
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.add.text(width * 0.75, y, timeStr, createCyberpunkTextStyle(16, '#888888'))
          .setOrigin(0.5);
      }
    }

    // Back Button
    createCyberpunkButton(
      this,
      width / 2,
      height * 0.92,
      240,
      60,
      0x666666,
      '> BACK TO MENU',
      () => {
        this.scene.start('MainMenu');
      }
    );
  }
}

