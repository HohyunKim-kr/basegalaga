import Phaser from 'phaser';
import { CYBERPUNK_COLORS, createCyberpunkTextStyle, createCyberpunkButton, createScanlines } from '../utils/cyberpunkStyle.js';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Cyberpunk gradient background
    const bg1 = this.add.rectangle(width / 2, 0, width, height / 3, CYBERPUNK_COLORS.bgDark);
    const bg2 = this.add.rectangle(width / 2, height / 3, width, height / 3, CYBERPUNK_COLORS.bgPurple);
    const bg3 = this.add.rectangle(width / 2, (height / 3) * 2, width, height / 3, CYBERPUNK_COLORS.bgBlue);
    
    // Scanline effect
    createScanlines(this, width, height);

    // Grid pattern overlay
    this.createGridPattern(width, height);

    // Title with glow effect
    const title = this.add.text(width / 2, height * 0.15, 'BASE GALAGA', {
      fontSize: '64px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#00ffff',
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
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle
    this.add.text(width / 2, height * 0.25, '> CYBERPUNK MINIAPP SHOOTER <', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Start Game Button
    const startBtn = createCyberpunkButton(
      this,
      width / 2,
      height * 0.45,
      240,
      70,
      CYBERPUNK_COLORS.neonCyan,
      '> START GAME',
      () => {
        this.scene.start('GameScene');
      }
    );

    // Leaderboard Button
    const leaderboardBtn = createCyberpunkButton(
      this,
      width / 2,
      height * 0.58,
      240,
      70,
      CYBERPUNK_COLORS.neonPink,
      '> LEADERBOARD',
      () => {
        this.scene.start('Leaderboard');
      }
    );

    // Instructions with cyberpunk style
    this.add.text(width / 2, height * 0.82, '[ARROW KEYS: MOVE] [SPACE: SHOOT]', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Version info
    this.add.text(width / 2, height * 0.92, 'v1.0.0 | BASE MINIAPP', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Animated particles
    this.createParticles(width, height);
  }

  createGridPattern(width, height) {
    const gridGroup = this.add.group();
    const gridColor = 0x00ffff;
    const gridAlpha = 0.1;
    const spacing = 50;

    // Vertical lines
    for (let x = 0; x < width; x += spacing) {
      const line = this.add.line(x, height / 2, 0, -height / 2, 0, height / 2, gridColor, gridAlpha);
      gridGroup.add(line);
    }

    // Horizontal lines
    for (let y = 0; y < height; y += spacing) {
      const line = this.add.line(width / 2, y, -width / 2, 0, width / 2, 0, gridColor, gridAlpha);
      gridGroup.add(line);
    }
  }

  createParticles(width, height) {
    // Create simple particle texture if not exists
    if (!this.textures.exists('cyberparticle')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(CYBERPUNK_COLORS.neonCyan);
      graphics.fillCircle(2, 2, 2);
      graphics.generateTexture('cyberparticle', 4, 4);
      graphics.destroy();
    }

    // Create particle emitter
    const particles = this.add.particles(0, 0, 'cyberparticle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 20, max: 50 },
      scale: { start: 0.8, end: 0 },
      tint: [CYBERPUNK_COLORS.neonCyan, CYBERPUNK_COLORS.neonPink, CYBERPUNK_COLORS.neonPurple],
      lifespan: 3000,
      frequency: 150,
      alpha: { start: 0.8, end: 0 }
    });
    
    particles.setDepth(-2);
  }
}

