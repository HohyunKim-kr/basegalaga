import Phaser from 'phaser';
import { STAGE_CONFIG, BOSS_CONFIG, calculateFinalScore } from '../utils/gameConfig.js';
import { CYBERPUNK_COLORS, createCyberpunkTextStyle } from '../utils/cyberpunkStyle.js';
import { WEAPON_PATTERNS, WEAPON_UPGRADE_ORDER } from '../utils/weaponPatterns.js';
import { ITEM_TYPES, getRandomItem } from '../utils/items.js';
import { isMobile } from '../main.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Initialize game state
    this.currentStage = 1;
    this.score = 0;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.scoreText = null;
    this.stageText = null;
    this.timeText = null;
    this.weaponText = null;
    this.player = null;
    this.playerHealth = 3;
    this.maxHealth = 3; // Maximum health (can be increased)
    this.cursors = null;
    this.bullets = null;
    this.enemies = null;
    this.enemyBullets = null;
    this.boss = null;
    this.bossHealthBar = null;
    this.gameOver = false;
    this.stageCleared = false;
    this.enemiesKilled = 0;
    this.enemiesToKill = 0;
    this.spawnTimers = [];
    this.enemyFormation = [];
    
    // Weapon system
    this.baseWeapon = WEAPON_PATTERNS.SINGLE; // Base weapon (always SINGLE)
    this.currentWeapon = WEAPON_PATTERNS.SINGLE;
    this.weaponLevel = 0;
    this.lastShotTime = 0;
    this.baseFireRate = 200; // Base fire rate
    this.fireRate = 200; // Current fire rate
    this.fireRateMultiplier = 1.0;
    
    // Item effects (only one active at a time)
    this.activeEffect = null; // Current active effect type
    this.activeEffects = {
      shield: false,
      scoreMultiplier: 1.0,
      effectTimer: null
    };
    this.shieldVisual = null;
    this.effectIndicator = null;
    
    // Item selection system
    this.itemSelectionActive = false;
    this.itemSelectionUI = null;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Resume physics if it was paused
    if (this.physics.world.isPaused) {
      this.physics.resume();
    }

    // Cyberpunk gradient background
    const bg1 = this.add.rectangle(width / 2, 0, width, height / 3, CYBERPUNK_COLORS.bgDark);
    const bg2 = this.add.rectangle(width / 2, height / 3, width, height / 3, CYBERPUNK_COLORS.bgPurple);
    const bg3 = this.add.rectangle(width / 2, (height / 3) * 2, width, height / 3, CYBERPUNK_COLORS.bgBlue);
    
    // Grid overlay
    this.createGridOverlay(width, height);

    // Create groups
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
    if (this.enemies) {
      this.enemies.clear(true, true);
    }
    if (this.enemyBullets) {
      this.enemyBullets.clear(true, true);
    }

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();

    // Player with cyberpunk glow
    this.player = this.add.rectangle(width / 2, height - 80, 40, 40, CYBERPUNK_COLORS.neonGreen);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setImmovable(true);
    
    // Player glow effect
    this.playerGlow = this.add.rectangle(this.player.x, this.player.y, 44, 44, CYBERPUNK_COLORS.neonGreen, 0.3);
    this.playerGlow.setDepth(-1);

    // Cyberpunk UI Panel
    this.createUIPanel(width, height);

    // UI Text with cyberpunk style (adjust font size for mobile)
    const fontSize = isMobile ? 14 : 18;
    const uiX = isMobile ? 20 : 30;
    this.scoreText = this.add.text(uiX, isMobile ? 20 : 25, '> SCORE: 0', createCyberpunkTextStyle(fontSize, CYBERPUNK_COLORS.textPrimary));

    this.stageText = this.add.text(uiX, isMobile ? 40 : 55, '> STAGE: 1', createCyberpunkTextStyle(fontSize, CYBERPUNK_COLORS.textAccent));

    this.timeText = this.add.text(uiX, isMobile ? 60 : 85, '> TIME: 00:00', createCyberpunkTextStyle(fontSize, CYBERPUNK_COLORS.textPrimary));

    // Health display with cyberpunk style (adjust position for mobile)
    const healthX = isMobile ? width - 150 : width - 180;
    const healthY = isMobile ? 20 : 25;
    this.healthText = this.add.text(healthX, healthY, `> HEALTH: ${this.playerHealth}/${this.maxHealth}`, 
      createCyberpunkTextStyle(isMobile ? 14 : 18, CYBERPUNK_COLORS.textWarning))
      .setOrigin(1, 0);

    // Weapon display (adjust position for mobile)
    const weaponX = isMobile ? width - 150 : width - 180;
    const weaponY = isMobile ? 45 : 55;
    this.weaponText = this.add.text(weaponX, weaponY, `> WEAPON: ${this.currentWeapon.name}`, 
      createCyberpunkTextStyle(isMobile ? 12 : 16, this.currentWeapon.color))
      .setOrigin(1, 0);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Mobile touch controls
    this.touchControls = {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false
    };
    
    if (isMobile) {
      this.createMobileControls();
    }

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.boss, this.hitBoss, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.hitPlayer, null, this);

    // Start timer
    this.startTime = this.time.now;

    // Start first stage
    this.startStage();
  }

  update(time) {
    if (this.gameOver) return;

    // Update elapsed time
    this.elapsedTime = time - this.startTime;
    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    this.timeText.setText(`> TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);

    // Player movement (4 directions) - keyboard or touch
    const moveSpeed = 5;
    if (this.cursors.left.isDown || this.touchControls.left) {
      this.player.x -= moveSpeed;
    }
    if (this.cursors.right.isDown || this.touchControls.right) {
      this.player.x += moveSpeed;
    }
    if (this.cursors.up.isDown || this.touchControls.up) {
      this.player.y -= moveSpeed;
    }
    if (this.cursors.down.isDown || this.touchControls.down) {
      this.player.y += moveSpeed;
    }
    
    // Keep player in bounds
    const { width, height } = this.cameras.main;
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, width - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, 100, height - 20);
    
    // Update player glow position
    if (this.playerGlow) {
      this.playerGlow.x = this.player.x;
      this.playerGlow.y = this.player.y;
    }

    // Shooting (continuous fire) - keyboard or touch
    if ((this.spaceKey.isDown || this.touchControls.shoot) && time - this.lastShotTime > (this.fireRate / this.fireRateMultiplier)) {
      this.shoot();
      this.lastShotTime = time;
    }

    // Enemy AI
    this.enemies.children.entries.forEach(enemy => {
      if (!enemy || !enemy.active) return;
      
      try {
        const config = STAGE_CONFIG[this.currentStage];
        if (!config) return;
        
        // Dynamic shoot rate based on stage and enemy position
        const baseShootRate = config.enemyShootRate;
        const distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const proximityBonus = distanceToPlayer < 300 ? 0.002 : 0;
        const dynamicShootRate = baseShootRate + proximityBonus;
        
        if (Math.random() < dynamicShootRate) {
          this.enemyShoot(enemy);
        }

        // Galaga pattern: some enemies dive down
        if (enemy.diveTimer && time > enemy.diveTimer && !enemy.isDiving) {
          this.startDive(enemy);
        }
      } catch (error) {
        console.warn('Enemy AI error:', error);
      }
    });

    // Boss AI
    if (this.boss && this.boss.active && BOSS_CONFIG[this.currentStage]) {
      const bossConfig = BOSS_CONFIG[this.currentStage];
      if (bossConfig && Math.random() < bossConfig.shootRate) {
        this.bossShoot();
      }
      this.updateBossPattern(time);
    }

    // Update shield visual
    if (this.activeEffects.shield && this.shieldVisual) {
      try {
        if (this.shieldVisual.outer && this.shieldVisual.outer.active) {
          this.shieldVisual.outer.x = this.player.x;
          this.shieldVisual.outer.y = this.player.y;
        }
        if (this.shieldVisual.inner && this.shieldVisual.inner.active) {
          this.shieldVisual.inner.x = this.player.x;
          this.shieldVisual.inner.y = this.player.y;
        }
        if (this.shieldVisual.particles && Array.isArray(this.shieldVisual.particles)) {
          this.shieldVisual.particles.forEach((particle, i) => {
            if (particle && particle.active) {
              const angle = (Math.PI * 2 / 8) * i + (time * 0.001);
              particle.x = this.player.x + Math.cos(angle) * 50;
              particle.y = this.player.y + Math.sin(angle) * 50;
            }
          });
        }
      } catch (error) {
        console.warn('Shield visual update error:', error);
      }
    }

    // Remove bullets that go off screen
    this.bullets.children.entries.forEach(bullet => {
      if (bullet && bullet.active && bullet.y < 0) {
        bullet.destroy();
      }
    });

    this.enemyBullets.children.entries.forEach(bullet => {
      if (bullet && bullet.active && bullet.y > this.cameras.main.height) {
        bullet.destroy();
      }
    });


    // Check stage clear
    try {
      if (!this.stageCleared && this.enemies && this.enemies.countActive(true) === 0) {
        if (!this.boss || !this.boss.active) {
          this.clearStage();
        }
      }
    } catch (error) {
      console.warn('Stage clear check error:', error);
    }
  }

  startStage() {
    this.stageCleared = false;
    this.enemiesKilled = 0;
    const config = STAGE_CONFIG[this.currentStage];
    this.enemiesToKill = config.enemyCount;
    if (config.hasBoss) {
      this.enemiesToKill += 1; // Boss counts as enemy
    }

    this.stageText.setText(`> STAGE: ${this.currentStage}`);

    // Spawn enemies in formation
    this.spawnEnemyFormation();

    // Spawn boss if this stage has one
    if (config.hasBoss) {
      this.time.delayedCall(3000, () => {
        this.spawnBoss();
      });
    }
  }

  spawnEnemyFormation() {
    const config = STAGE_CONFIG[this.currentStage];
    const { width, height } = this.cameras.main;
    
    // Clear existing formation
    this.enemyFormation = [];

    // Grid formation (Galaga style)
    const cols = Math.ceil(Math.sqrt(config.enemyCount));
    const rows = Math.ceil(config.enemyCount / cols);
    const spacingX = 60;
    const spacingY = 50;
    const startX = (width - (cols - 1) * spacingX) / 2;
    const startY = 100;

    let enemyIndex = 0;
    for (let row = 0; row < rows && enemyIndex < config.enemyCount; row++) {
      for (let col = 0; col < cols && enemyIndex < config.enemyCount; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        
        const enemy = this.add.rectangle(x, y, 30, 30, config.enemyColor);
        this.physics.add.existing(enemy);
        enemy.body.setImmovable(true);
        enemy.health = config.enemyHealth;
        enemy.maxHealth = config.enemyHealth;
        enemy.damage = config.enemyDamage;
        enemy.points = config.enemyPoints;
        enemy.originalX = x;
        enemy.originalY = y;
        enemy.isDiving = false;
        enemy.diveTimer = this.time.now + Phaser.Math.Between(5000, 15000);
        
        this.enemies.add(enemy);
        this.enemyFormation.push(enemy);
        enemyIndex++;
      }
    }

    // Start formation movement
    this.startFormationMovement();
  }

  startFormationMovement() {
    // Galaga style: enemies move side to side, gradually moving down
    // Create individual tweens for each enemy to avoid issues
    this.enemyFormation.forEach((enemy, index) => {
      if (!enemy || !enemy.active) return;
      
      try {
        // Side to side movement with slight delay for wave effect
        this.tweens.add({
          targets: enemy,
          x: enemy.x + 100,
          duration: 2000 + (index % 3) * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: index * 100
        });
      } catch (error) {
        console.warn('Formation movement error:', error);
      }
    });
  }

  startDive(enemy) {
    if (!enemy.active || enemy.isDiving) return;
    
    enemy.isDiving = true;
    enemy.body.setImmovable(false);
    enemy.body.setVelocityY(150);
    enemy.body.setVelocityX(Phaser.Math.Between(-100, 100));
    enemy.body.setBounce(0.5, 0.5);
    enemy.body.setCollideWorldBounds(true);
    
    // Return to formation after a while
    this.time.delayedCall(3000, () => {
      if (enemy.active && !this.gameOver) {
        this.returnToFormation(enemy);
      }
    });
  }

  returnToFormation(enemy) {
    if (!enemy.active) return;
    
    enemy.isDiving = false;
    const tween = this.tweens.add({
      targets: enemy,
      x: enemy.originalX,
      y: enemy.originalY,
      duration: 2000,
      onComplete: () => {
        if (enemy.active) {
          enemy.body.setImmovable(true);
          enemy.body.setVelocity(0, 0);
        }
      }
    });
  }

  spawnBoss() {
    if (this.boss && this.boss.active) return;
    
    const bossConfig = BOSS_CONFIG[this.currentStage];
    if (!bossConfig) return;

    const { width } = this.cameras.main;
    this.boss = this.add.rectangle(width / 2, 100, bossConfig.size, bossConfig.size, bossConfig.color);
    this.physics.add.existing(this.boss);
    this.boss.body.setImmovable(true);
    this.boss.health = bossConfig.health;
    this.boss.maxHealth = bossConfig.health;
    this.boss.damage = bossConfig.damage;
    this.boss.points = bossConfig.points;
    this.boss.pattern = bossConfig.pattern;
    this.boss.startX = width / 2;
    this.boss.startY = 100;
    this.boss.patternTime = 0;

    // Boss health bar
    this.bossHealthBar = this.add.rectangle(width / 2, 50, 200, 10, 0xff0000);
    this.bossHealthBar.setOrigin(0.5);
    this.updateBossHealthBar();
  }

  updateBossPattern(time) {
    if (!this.boss || !this.boss.active) return;
    
    try {
      const bossConfig = BOSS_CONFIG[this.currentStage];
      if (!bossConfig) return;
      
      const { width } = this.cameras.main;
      
      if (!this.boss.patternTime) {
        this.boss.patternTime = 0;
      }
      
      if (bossConfig.pattern === 'zigzag') {
        // Zigzag pattern
        this.boss.patternTime += 0.02;
        const amplitude = width / 3;
        this.boss.x = this.boss.startX + Math.sin(this.boss.patternTime) * amplitude;
        this.boss.y = this.boss.startY + Math.cos(this.boss.patternTime * 2) * 30;
      } else if (bossConfig.pattern === 'spiral') {
        // Spiral pattern
        this.boss.patternTime += 0.015;
        const radius = 100 + Math.sin(this.boss.patternTime) * 50;
        this.boss.x = this.boss.startX + Math.cos(this.boss.patternTime) * radius;
        this.boss.y = this.boss.startY + Math.sin(this.boss.patternTime) * 50;
      }
    } catch (error) {
      console.warn('Boss pattern update error:', error);
    }
  }

  updateBossHealthBar() {
    if (!this.boss || !this.bossHealthBar) return;
    
    const healthPercent = this.boss.health / this.boss.maxHealth;
    const barWidth = 200 * healthPercent;
    this.bossHealthBar.setSize(barWidth, 10);
    
    // Color based on health
    if (healthPercent > 0.5) {
      this.bossHealthBar.setFillStyle(0xff0000);
    } else if (healthPercent > 0.25) {
      this.bossHealthBar.setFillStyle(0xff8800);
    } else {
      this.bossHealthBar.setFillStyle(0xffff00);
    }
  }

  shoot() {
    const pattern = this.currentWeapon;
    const centerX = this.player.x;
    const startY = this.player.y - 30;
    
    if (pattern.bullets === 1) {
      // Single bullet
      const bullet = this.add.rectangle(centerX, startY, pattern.size.width, pattern.size.height, pattern.color);
      this.physics.add.existing(bullet);
      this.bullets.add(bullet);
      bullet.body.setVelocityY(-pattern.speed);
    } else {
      // Multiple bullets with spread
      const totalSpread = pattern.spread * (pattern.bullets - 1);
      const startAngle = -totalSpread / 2;
      
      for (let i = 0; i < pattern.bullets; i++) {
        const angle = startAngle + (pattern.spread * i);
        const offsetX = Math.sin(angle) * 30;
        
        const bullet = this.add.rectangle(centerX + offsetX, startY, pattern.size.width, pattern.size.height, pattern.color);
        this.physics.add.existing(bullet);
        this.bullets.add(bullet);
        
        // Set velocity with spread
        bullet.body.setVelocityX(Math.sin(angle) * 100);
        bullet.body.setVelocityY(-pattern.speed);
      }
    }
  }

  enemyShoot(enemy) {
    if (!enemy || !enemy.active) return;
    
    try {
      const config = STAGE_CONFIG[this.currentStage];
      if (!config) return;
      const stage = this.currentStage;
    
    // Vary bullet patterns based on stage
    if (stage <= 2) {
      // Early stages: simple straight or slightly aimed
      const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, enemy.fillColor);
      this.physics.add.existing(bullet);
      this.enemyBullets.add(bullet);
      
      if (Math.random() < 0.3) {
        // 30% chance to aim at player
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        bullet.body.setVelocityX(Math.cos(angle) * 80);
        bullet.body.setVelocityY(Math.sin(angle) * 80 + config.enemySpeed * 0.5);
      } else {
        // Straight down
        bullet.body.setVelocityY(config.enemySpeed);
        bullet.body.setVelocityX(Phaser.Math.Between(-20, 20));
      }
    } else if (stage <= 5) {
      // Mid stages: more aiming, occasional spread
      if (Math.random() < 0.2 && stage >= 4) {
        // 20% chance for spread shot (stage 4+)
        for (let i = 0; i < 3; i++) {
          const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, enemy.fillColor);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const spread = (i - 1) * 0.3;
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + spread;
          bullet.body.setVelocityX(Math.cos(angle) * 100);
          bullet.body.setVelocityY(Math.sin(angle) * 100 + config.enemySpeed * 0.3);
        }
      } else {
        // Aimed shot
        const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, enemy.fillColor);
        this.physics.add.existing(bullet);
        this.enemyBullets.add(bullet);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        bullet.body.setVelocityX(Math.cos(angle) * 100);
        bullet.body.setVelocityY(Math.sin(angle) * 100 + config.enemySpeed * 0.5);
      }
    } else {
      // Late stages: complex patterns
      const pattern = Math.random();
      if (pattern < 0.3) {
        // 30% spread shot
        for (let i = 0; i < 3; i++) {
          const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, enemy.fillColor);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const spread = (i - 1) * 0.4;
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + spread;
          bullet.body.setVelocityX(Math.cos(angle) * 120);
          bullet.body.setVelocityY(Math.sin(angle) * 120 + config.enemySpeed * 0.3);
        }
      } else if (pattern < 0.5 && stage >= 8) {
        // 20% chance for double shot (stage 8+)
        for (let i = 0; i < 2; i++) {
          const bullet = this.add.rectangle(enemy.x + (i - 0.5) * 15, enemy.y + 20, 5, 15, enemy.fillColor);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
          bullet.body.setVelocityX(Math.cos(angle) * 120);
          bullet.body.setVelocityY(Math.sin(angle) * 120 + config.enemySpeed * 0.4);
        }
      } else {
        // Aimed shot with prediction
        const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, enemy.fillColor);
        this.physics.add.existing(bullet);
        this.enemyBullets.add(bullet);
        // Predict player movement
        const predictX = this.player.x + (this.cursors.left.isDown ? -50 : this.cursors.right.isDown ? 50 : 0);
        const predictY = this.player.y + (this.cursors.up.isDown ? -50 : this.cursors.down.isDown ? 50 : 0);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, predictX, predictY);
        bullet.body.setVelocityX(Math.cos(angle) * 120);
        bullet.body.setVelocityY(Math.sin(angle) * 120 + config.enemySpeed * 0.4);
      }
    }
    } catch (error) {
      console.warn('Enemy shoot error:', error);
    }
  }

  bossShoot() {
    if (!this.boss || !this.boss.active) return;
    
    try {
      const bossConfig = BOSS_CONFIG[this.currentStage];
      if (!bossConfig) return;
      const stage = this.currentStage;
    
    if (stage === 5) {
      // Stage 5 boss: 3-way spread
      for (let i = 0; i < 3; i++) {
        const bullet = this.add.rectangle(this.boss.x, this.boss.y + 40, 8, 20, bossConfig.color);
        this.physics.add.existing(bullet);
        this.enemyBullets.add(bullet);
        
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        const spread = (i - 1) * 0.4;
        bullet.body.setVelocityX(Math.cos(angle + spread) * 150);
        bullet.body.setVelocityY(Math.sin(angle + spread) * 150);
      }
    } else if (stage === 10) {
      // Stage 10 boss: complex pattern
      const pattern = Math.random();
      if (pattern < 0.4) {
        // 5-way spread
        for (let i = 0; i < 5; i++) {
          const bullet = this.add.rectangle(this.boss.x, this.boss.y + 40, 8, 20, bossConfig.color);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
          const spread = (i - 2) * 0.3;
          bullet.body.setVelocityX(Math.cos(angle + spread) * 180);
          bullet.body.setVelocityY(Math.sin(angle + spread) * 180);
        }
      } else if (pattern < 0.7) {
        // Circular pattern
        for (let i = 0; i < 8; i++) {
          const bullet = this.add.rectangle(this.boss.x, this.boss.y + 40, 8, 20, bossConfig.color);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const angle = (Math.PI * 2 / 8) * i;
          bullet.body.setVelocityX(Math.cos(angle) * 150);
          bullet.body.setVelocityY(Math.sin(angle) * 150);
        }
      } else {
        // Targeted burst
        for (let i = 0; i < 4; i++) {
          const bullet = this.add.rectangle(this.boss.x, this.boss.y + 40, 8, 20, bossConfig.color);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const predictX = this.player.x + (this.cursors.left.isDown ? -80 : this.cursors.right.isDown ? 80 : 0);
          const predictY = this.player.y + (this.cursors.up.isDown ? -80 : this.cursors.down.isDown ? 80 : 0);
          const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, predictX, predictY);
          const spread = (i - 1.5) * 0.2;
          bullet.body.setVelocityX(Math.cos(angle + spread) * 200);
          bullet.body.setVelocityY(Math.sin(angle + spread) * 200);
        }
      }
    }
    } catch (error) {
      console.warn('Boss shoot error:', error);
    }
  }

  hitEnemy(bullet, enemy) {
    if (!enemy || !bullet || !enemy.active || !bullet.active) return;
    
    try {
      bullet.destroy();
      enemy.health -= 1;
      
      if (enemy.health <= 0) {
        // Calculate score with multiplier
        const basePoints = enemy.points || 10;
        const finalPoints = Math.floor(basePoints * this.activeEffects.scoreMultiplier);
        this.score += finalPoints;
        this.enemiesKilled++;
        this.scoreText.setText(`> SCORE: ${this.score}`);
        
        enemy.destroy();
      }
    } catch (error) {
      console.warn('Hit enemy error:', error);
    }
  }

  hitBoss(bullet, boss) {
    if (!boss || !bullet || !boss.active || !bullet.active) return;
    
    try {
      bullet.destroy();
      boss.health -= 1;
      this.updateBossHealthBar();
      
      if (boss.health <= 0) {
      // Calculate score with multiplier
      const basePoints = boss.points;
      const finalPoints = Math.floor(basePoints * this.activeEffects.scoreMultiplier);
      this.score += finalPoints;
      this.enemiesKilled++;
      this.scoreText.setText(`> SCORE: ${this.score}`);
      
      // Restore full health when boss is defeated
      this.playerHealth = this.maxHealth;
      this.healthText.setText(`> HEALTH: ${this.playerHealth}/${this.maxHealth}`);
      
      // Show health restored message
      const { width, height } = this.cameras.main;
      const restoreText = this.add.text(width / 2, height / 2, '> HEALTH RESTORED <', {
        fontSize: '36px',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        color: CYBERPUNK_COLORS.textSuccess,
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: CYBERPUNK_COLORS.textSuccess,
          blur: 3,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      
      this.time.delayedCall(1000, () => {
        restoreText.destroy();
      });
      
      if (this.bossHealthBar) {
        this.bossHealthBar.destroy();
        this.bossHealthBar = null;
      }
      boss.destroy();
      this.boss = null;
      }
    } catch (error) {
      console.warn('Hit boss error:', error);
    }
  }

  showItemSelection() {
    if (this.itemSelectionActive) return;
    
    this.itemSelectionActive = true;
    this.physics.pause();
    
    const { width, height } = this.cameras.main;
    
    // Generate 3 random items
    const availableItems = Object.values(ITEM_TYPES);
    const selectedItems = [];
    const usedIndices = new Set();
    
    while (selectedItems.length < 3 && selectedItems.length < availableItems.length) {
      const randomIndex = Math.floor(Math.random() * availableItems.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedItems.push(availableItems[randomIndex]);
      }
    }
    
    // Dark overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(1000);
    
    // Selection panel
    const panel = this.add.rectangle(width / 2, height / 2, width * 0.9, height * 0.6, CYBERPUNK_COLORS.bgDark, 0.95);
    panel.setStrokeStyle(3, CYBERPUNK_COLORS.neonCyan, 1);
    panel.setDepth(1001);
    
    // Title
    const title = this.add.text(width / 2, height * 0.25, '> SELECT ITEM <', {
      fontSize: '36px',
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
    }).setOrigin(0.5).setDepth(1002);
    
    // Item buttons
    const itemButtons = [];
    const itemSpacing = width / 4;
    const startX = width / 2 - itemSpacing;
    
    selectedItems.forEach((itemType, index) => {
      const x = startX + (index * itemSpacing);
      const y = height / 2;
      
      // Item card
      const card = this.add.rectangle(x, y, 200, 250, itemType.color, 0.2);
      card.setStrokeStyle(3, itemType.color, 0.8);
      card.setDepth(1002);
      card.setInteractive({ useHandCursor: true });
      
      // Item icon (large circle)
      const icon = this.add.circle(x, y - 40, 40, itemType.color);
      icon.setStrokeStyle(4, itemType.color, 1);
      icon.setDepth(1003);
      
      // Pulsing icon animation
      this.tweens.add({
        targets: icon,
        scale: { from: 0.9, to: 1.1 },
        alpha: { from: 0.7, to: 1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Item name
      const nameText = this.add.text(x, y + 20, itemType.name, {
        fontSize: '20px',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        color: `#${itemType.color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(1003);
      
      // Item description
      let description = '';
      if (itemType.effect === 'upgradeWeapon') {
        description = 'WEAPON UPGRADE\nPERMANENT';
      } else if (itemType.effect === 'restoreHealth') {
        description = 'HEALTH RESTORE\nFULL HP';
      } else if (itemType.effect === 'increaseFireRate') {
        description = 'FIRE RATE UP\nPERMANENT';
      } else if (itemType.effect === 'activateShield') {
        description = 'MAX HEALTH +1\nPERMANENT';
      } else if (itemType.effect === 'scoreMultiplier') {
        description = 'SCORE MULTIPLIER\n+0.2 PERMANENT';
      }
      
      const descText = this.add.text(x, y + 60, description, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        align: 'center'
      }).setOrigin(0.5).setDepth(1003);
      
      // Selection number
      const numText = this.add.text(x, y - 100, `[${index + 1}]`, {
        fontSize: '24px',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        color: CYBERPUNK_COLORS.textAccent,
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(1003);
      
      // Click handler
      card.on('pointerdown', () => {
        this.selectItem(itemType);
      });
      
      // Hover effect
      card.on('pointerover', () => {
        card.setFillStyle(itemType.color, 0.4);
        card.setStrokeStyle(4, itemType.color, 1);
        icon.setScale(1.2);
      });
      
      card.on('pointerout', () => {
        card.setFillStyle(itemType.color, 0.2);
        card.setStrokeStyle(3, itemType.color, 0.8);
        icon.setScale(1);
      });
      
      itemButtons.push({
        card,
        icon,
        nameText,
        descText,
        numText,
        itemType
      });
    });
    
    // Instructions
    const instructionText = this.add.text(width / 2, height * 0.75, 'CLICK TO SELECT | [1] [2] [3] KEYS', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: CYBERPUNK_COLORS.textAccent,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1003);
    
    // Keyboard selection
    const key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    const key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    
    key1.on('down', () => {
      if (selectedItems[0]) this.selectItem(selectedItems[0]);
    });
    
    key2.on('down', () => {
      if (selectedItems[1]) this.selectItem(selectedItems[1]);
    });
    
    key3.on('down', () => {
      if (selectedItems[2]) this.selectItem(selectedItems[2]);
    });
    
    this.itemSelectionUI = {
      overlay,
      panel,
      title,
      instructionText,
      itemButtons,
      selectedItems,
      keys: [key1, key2, key3]
    };
  }

  selectItem(itemType) {
    if (!this.itemSelectionActive) return;
    
    // Clean up selection UI
    if (this.itemSelectionUI) {
      try {
        if (this.itemSelectionUI.overlay && this.itemSelectionUI.overlay.active) {
          this.itemSelectionUI.overlay.destroy();
        }
        if (this.itemSelectionUI.panel && this.itemSelectionUI.panel.active) {
          this.itemSelectionUI.panel.destroy();
        }
        if (this.itemSelectionUI.title && this.itemSelectionUI.title.active) {
          this.itemSelectionUI.title.destroy();
        }
        if (this.itemSelectionUI.instructionText && this.itemSelectionUI.instructionText.active) {
          this.itemSelectionUI.instructionText.destroy();
        }
        
        if (this.itemSelectionUI.itemButtons && Array.isArray(this.itemSelectionUI.itemButtons)) {
          this.itemSelectionUI.itemButtons.forEach(btn => {
            if (btn.card && btn.card.active) btn.card.destroy();
            if (btn.icon && btn.icon.active) btn.icon.destroy();
            if (btn.nameText && btn.nameText.active) btn.nameText.destroy();
            if (btn.descText && btn.descText.active) btn.descText.destroy();
            if (btn.numText && btn.numText.active) btn.numText.destroy();
          });
        }
        
        if (this.itemSelectionUI.keys && Array.isArray(this.itemSelectionUI.keys)) {
          this.itemSelectionUI.keys.forEach(key => {
            if (key) key.removeAllListeners();
          });
        }
      } catch (error) {
        console.warn('Item selection cleanup error:', error);
      }
      
      this.itemSelectionUI = null;
    }
    
    this.itemSelectionActive = false;
    this.physics.resume();
    
    // Apply permanent stat upgrade
    switch (itemType.effect) {
      case 'upgradeWeapon':
        this.permanentUpgradeWeapon();
        break;
      case 'restoreHealth':
        this.permanentRestoreHealth();
        break;
      case 'increaseFireRate':
        this.permanentIncreaseFireRate();
        break;
      case 'activateShield':
        this.permanentIncreaseMaxHealth();
        break;
      case 'scoreMultiplier':
        this.permanentIncreaseScoreMultiplier();
        break;
    }
    
    // Show selection effect
    const { width, height } = this.cameras.main;
    const effectText = this.add.text(width / 2, height / 2, `> ${itemType.name} SELECTED <`, {
      fontSize: '32px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: `#${itemType.color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: `#${itemType.color.toString(16).padStart(6, '0')}`,
        blur: 3,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setDepth(1000);
    
    this.tweens.add({
      targets: effectText,
      y: effectText.y - 50,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        effectText.destroy();
        // Proceed to next stage after selection
        this.proceedToNextStage();
      }
    });
  }


  cancelActiveEffect() {
    // Cancel current active effect
    if (this.activeEffects.effectTimer) {
      this.activeEffects.effectTimer.remove();
      this.activeEffects.effectTimer = null;
    }
    
    // Reset to base stats
    if (this.activeEffect === 'upgradeWeapon') {
      this.currentWeapon = this.baseWeapon;
      this.weaponText.setText(`> WEAPON: ${this.currentWeapon.name}`);
      this.weaponText.setColor(`#${this.currentWeapon.color.toString(16).padStart(6, '0')}`);
    }
    
    if (this.activeEffect === 'increaseFireRate') {
      this.fireRate = this.baseFireRate;
      this.fireRateMultiplier = 1.0;
    }
    
    if (this.activeEffect === 'activateShield') {
      this.activeEffects.shield = false;
      if (this.shieldVisual) {
        try {
          if (this.shieldVisual.outer && this.shieldVisual.outer.active) {
            this.shieldVisual.outer.destroy();
          }
          if (this.shieldVisual.inner && this.shieldVisual.inner.active) {
            this.shieldVisual.inner.destroy();
          }
          if (this.shieldVisual.particles && Array.isArray(this.shieldVisual.particles)) {
            this.shieldVisual.particles.forEach(p => {
              if (p && p.active) p.destroy();
            });
          }
        } catch (error) {
          console.warn('Shield visual cleanup error:', error);
        }
        this.shieldVisual = null;
      }
    }
    
    if (this.activeEffect === 'scoreMultiplier') {
      this.activeEffects.scoreMultiplier = 1.0;
    }
    
    // Remove effect indicator
    if (this.effectIndicator) {
      try {
        if (this.effectIndicator.panel && this.effectIndicator.panel.active) {
          this.effectIndicator.panel.destroy();
        }
        if (this.effectIndicator.text && this.effectIndicator.text.active) {
          this.effectIndicator.text.destroy();
        }
        if (this.effectIndicator.timerBar && this.effectIndicator.timerBar.active) {
          this.effectIndicator.timerBar.destroy();
        }
      } catch (error) {
        console.warn('Effect indicator cleanup error:', error);
      }
      this.effectIndicator = null;
    }
    
    this.activeEffect = null;
  }

  permanentUpgradeWeapon() {
    // Permanent weapon upgrade - move to next level
    const currentIndex = WEAPON_UPGRADE_ORDER.indexOf(this.baseWeapon.name);
    if (currentIndex < WEAPON_UPGRADE_ORDER.length - 1) {
      const nextWeaponName = WEAPON_UPGRADE_ORDER[currentIndex + 1];
      this.baseWeapon = WEAPON_PATTERNS[nextWeaponName];
      this.currentWeapon = this.baseWeapon;
      this.weaponLevel = currentIndex + 1;
      
      this.weaponText.setText(`> WEAPON: ${this.currentWeapon.name}`);
      this.weaponText.setColor(`#${this.currentWeapon.color.toString(16).padStart(6, '0')}`);
      
      this.showItemMessage('WEAPON PERMANENTLY UPGRADED!', this.currentWeapon.color);
    }
  }

  permanentRestoreHealth() {
    // Restore health to max
    this.playerHealth = Math.min(this.maxHealth, this.playerHealth + 1);
    this.healthText.setText(`> HEALTH: ${this.playerHealth}/${this.maxHealth}`);
    this.showItemMessage('HEALTH RESTORED!', ITEM_TYPES.HEALTH.color);
  }

  permanentIncreaseMaxHealth() {
    // Permanently increase max health
    this.maxHealth += 1;
    this.playerHealth += 1; // Also increase current health
    this.healthText.setText(`> HEALTH: ${this.playerHealth}/${this.maxHealth}`);
    this.showItemMessage(`MAX HEALTH INCREASED TO ${this.maxHealth}!`, ITEM_TYPES.SHIELD.color);
  }

  permanentIncreaseFireRate() {
    // Permanently increase fire rate (reduce delay)
    this.baseFireRate = Math.max(100, this.baseFireRate - 30); // Reduce by 30ms, min 100ms
    this.fireRate = this.baseFireRate;
    this.fireRateMultiplier = 1.0;
    this.showItemMessage('FIRE RATE PERMANENTLY INCREASED!', ITEM_TYPES.SPEED_UP.color);
  }

  activateShield() {
    this.activeEffects.shield = true;
    this.activeEffect = 'activateShield';
    this.createEffectIndicator('SHIELD ACTIVATED!', ITEM_TYPES.SHIELD.color, ITEM_TYPES.SHIELD.duration);
    
    // Create enhanced shield visual with multiple layers
    if (this.shieldVisual) {
      try {
        if (this.shieldVisual.outer && this.shieldVisual.outer.active) {
          this.shieldVisual.outer.destroy();
        }
        if (this.shieldVisual.inner && this.shieldVisual.inner.active) {
          this.shieldVisual.inner.destroy();
        }
        if (this.shieldVisual.particles && Array.isArray(this.shieldVisual.particles)) {
          this.shieldVisual.particles.forEach(p => {
            if (p && p.active) p.destroy();
          });
        }
      } catch (error) {
        console.warn('Shield visual cleanup error:', error);
      }
    }
    
    // Outer shield
    const outerShield = this.add.circle(this.player.x, this.player.y, 55, ITEM_TYPES.SHIELD.color, 0.2);
    outerShield.setStrokeStyle(4, ITEM_TYPES.SHIELD.color, 0.6);
    outerShield.setDepth(-1);
    
    // Inner shield
    const innerShield = this.add.circle(this.player.x, this.player.y, 45, ITEM_TYPES.SHIELD.color, 0.4);
    innerShield.setStrokeStyle(3, ITEM_TYPES.SHIELD.color, 0.9);
    innerShield.setDepth(-1);
    
    this.shieldVisual = { outer: outerShield, inner: innerShield };
    
    // Enhanced shield animation
    this.tweens.add({
      targets: outerShield,
      scale: { from: 0.9, to: 1.3 },
      alpha: { from: 0.3, to: 0.6 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.tweens.add({
      targets: innerShield,
      scale: { from: 1.1, to: 0.8 },
      alpha: { from: 0.6, to: 0.9 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Rotating particles around shield
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const particle = this.add.circle(
        this.player.x + Math.cos(angle) * 50,
        this.player.y + Math.sin(angle) * 50,
        3,
        ITEM_TYPES.SHIELD.color
      );
      particle.setDepth(-1);
      
      this.tweens.add({
        targets: particle,
        x: { value: this.player.x + Math.cos(angle) * 50, duration: 2000 },
        y: { value: this.player.y + Math.sin(angle) * 50, duration: 2000 },
        repeat: -1,
        ease: 'Linear'
      });
      
      if (!this.shieldVisual.particles) {
        this.shieldVisual.particles = [];
      }
      this.shieldVisual.particles.push(particle);
    }
    
    // Remove shield after duration
    this.activeEffects.effectTimer = this.time.delayedCall(ITEM_TYPES.SHIELD.duration, () => {
      this.activeEffects.shield = false;
      if (this.shieldVisual) {
        try {
          if (this.shieldVisual.outer && this.shieldVisual.outer.active) {
            this.shieldVisual.outer.destroy();
          }
          if (this.shieldVisual.inner && this.shieldVisual.inner.active) {
            this.shieldVisual.inner.destroy();
          }
          if (this.shieldVisual.particles && Array.isArray(this.shieldVisual.particles)) {
            this.shieldVisual.particles.forEach(p => {
              if (p && p.active) p.destroy();
            });
          }
        } catch (error) {
          console.warn('Shield visual cleanup error:', error);
        }
        this.shieldVisual = null;
      }
      this.activeEffect = null;
      if (this.effectIndicator) {
        try {
          if (this.effectIndicator.panel && this.effectIndicator.panel.active) {
            this.effectIndicator.panel.destroy();
          }
          if (this.effectIndicator.text && this.effectIndicator.text.active) {
            this.effectIndicator.text.destroy();
          }
          if (this.effectIndicator.timerBar && this.effectIndicator.timerBar.active) {
            this.effectIndicator.timerBar.destroy();
          }
        } catch (error) {
          console.warn('Effect indicator cleanup error:', error);
        }
        this.effectIndicator = null;
      }
      this.activeEffects.effectTimer = null;
    });
  }

  permanentIncreaseScoreMultiplier() {
    // Permanently increase base score multiplier
    this.activeEffects.scoreMultiplier += 0.2; // Add 0.2 to multiplier (stacks)
    this.showItemMessage(`SCORE MULTIPLIER: x${this.activeEffects.scoreMultiplier.toFixed(1)}!`, ITEM_TYPES.SCORE_BONUS.color);
  }

  createEffectIndicator(text, color, duration) {
    const { width, height } = this.cameras.main;
    
    // Remove existing indicator
    if (this.effectIndicator) {
      try {
        if (this.effectIndicator.panel && this.effectIndicator.panel.active) {
          this.effectIndicator.panel.destroy();
        }
        if (this.effectIndicator.text && this.effectIndicator.text.active) {
          this.effectIndicator.text.destroy();
        }
        if (this.effectIndicator.timerBar && this.effectIndicator.timerBar.active) {
          this.effectIndicator.timerBar.destroy();
        }
      } catch (error) {
        console.warn('Effect indicator cleanup error:', error);
      }
    }
    
    // Create indicator panel
    const panel = this.add.rectangle(width - 150, height - 80, 280, 50, color, 0.3);
    panel.setStrokeStyle(2, color, 0.8);
    
    const indicatorText = this.add.text(width - 150, height - 80, text, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Timer bar
    const timerBar = this.add.rectangle(width - 150, height - 55, 260, 4, color);
    timerBar.setOrigin(0.5);
    
    this.effectIndicator = { panel, text: indicatorText, timerBar, maxWidth: 260 };
    
    // Animate timer bar
    this.tweens.add({
      targets: timerBar,
      width: 0,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        if (this.effectIndicator && this.effectIndicator.timerBar === timerBar) {
          timerBar.destroy();
        }
      }
    });
    
    // Pulsing effect
    this.tweens.add({
      targets: panel,
      alpha: { from: 0.5, to: 0.8 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  showItemMessage(text, color) {
    const { width, height } = this.cameras.main;
    const message = this.add.text(width / 2, height * 0.3, `> ${text} <`, {
      fontSize: '24px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: `#${color.toString(16).padStart(6, '0')}`,
        blur: 15,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: message,
      y: message.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => message.destroy()
    });
  }

  hitPlayer(player, enemyOrBullet) {
    if (this.gameOver) return;
    
    // Shield protects from damage
    if (this.activeEffects.shield) {
      if (enemyOrBullet.body && enemyOrBullet.body.velocity) {
        if (this.enemyBullets.contains(enemyOrBullet)) {
          enemyOrBullet.destroy();
        }
      }
      return; // Shield blocks damage
    }
    
    if (enemyOrBullet && enemyOrBullet.active) {
      const damage = enemyOrBullet.damage || 1;
      this.playerHealth = Math.max(0, this.playerHealth - damage);
      this.healthText.setText(`> HEALTH: ${this.playerHealth}/${this.maxHealth}`);
      
      if (enemyOrBullet.body && enemyOrBullet.body.velocity) {
        // Only destroy bullets, not enemies (enemies bounce)
        if (this.enemyBullets.contains(enemyOrBullet)) {
          enemyOrBullet.destroy();
        }
      }
    }
    
    if (this.playerHealth <= 0) {
      this.gameOver = true;
      this.physics.pause();
      
      // Calculate final score
      const finalScore = calculateFinalScore(this.score, this.elapsedTime, this.currentStage);
      
      this.time.delayedCall(500, () => {
        this.scene.start('GameOver', { 
          score: finalScore,
          baseScore: this.score,
          time: this.elapsedTime,
          stage: this.currentStage
        });
      });
    }
  }

  clearStage() {
    if (this.stageCleared) return;
    
    try {
      this.stageCleared = true;
      this.score += this.currentStage * 100; // Stage clear bonus
      this.scoreText.setText(`> SCORE: ${this.score}`);
    
    // Stage clear message
    const { width, height } = this.cameras.main;
    const clearText = this.add.text(width / 2, height / 2, `> STAGE ${this.currentStage} CLEAR <`, {
      fontSize: '52px',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      color: CYBERPUNK_COLORS.textSuccess,
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: CYBERPUNK_COLORS.textSuccess,
        blur: 3,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Animated glow
    this.tweens.add({
      targets: clearText,
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
      // Show item selection after stage clear
      this.time.delayedCall(2000, () => {
        if (clearText && clearText.active) {
          clearText.destroy();
        }
        this.showItemSelection();
      });
    } catch (error) {
      console.error('Clear stage error:', error);
      // Fallback: proceed to next stage even if error
      if (this.currentStage < 10) {
        this.currentStage++;
        this.startStage();
      }
    }
  }

  proceedToNextStage() {
    if (this.currentStage < 10) {
      this.currentStage++;
      this.startStage();
    } else {
      // All stages cleared!
      const finalScore = calculateFinalScore(this.score, this.elapsedTime, this.currentStage);
      this.scene.start('GameOver', {
        score: finalScore,
        baseScore: this.score,
        time: this.elapsedTime,
        stage: this.currentStage,
        allCleared: true
      });
    }
  }

  createUIPanel(width, height) {
    // Top panel
    const topPanel = this.add.rectangle(width / 2, 15, width, 120, CYBERPUNK_COLORS.bgDark, 0.8);
    topPanel.setStrokeStyle(2, CYBERPUNK_COLORS.neonCyan, 0.5);
    
    // Bottom panel
    const bottomPanel = this.add.rectangle(width / 2, height - 15, width, 30, CYBERPUNK_COLORS.bgDark, 0.8);
    bottomPanel.setStrokeStyle(2, CYBERPUNK_COLORS.neonCyan, 0.5);
  }

  createGridOverlay(width, height) {
    const gridGroup = this.add.group();
    const gridColor = CYBERPUNK_COLORS.neonCyan;
    const gridAlpha = 0.05;
    const spacing = 100;

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

  shutdown() {
    // Clean up mobile controls
    if (this.mobileControls) {
      Object.values(this.mobileControls).forEach(control => {
        if (control && control.destroy) {
          try {
            control.destroy();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
      this.mobileControls = null;
    }
    
    // Clean up
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
    if (this.enemies) {
      this.enemies.clear(true, true);
    }
    if (this.enemyBullets) {
      this.enemyBullets.clear(true, true);
    }
    if (this.boss) {
      this.boss.destroy();
    }
    if (this.bossHealthBar) {
      this.bossHealthBar.destroy();
    }
    if (this.playerGlow) {
      this.playerGlow.destroy();
    }
    if (this.shieldVisual) {
      try {
        if (this.shieldVisual.outer && this.shieldVisual.outer.active) {
          this.shieldVisual.outer.destroy();
        }
        if (this.shieldVisual.inner && this.shieldVisual.inner.active) {
          this.shieldVisual.inner.destroy();
        }
        if (this.shieldVisual.particles && Array.isArray(this.shieldVisual.particles)) {
          this.shieldVisual.particles.forEach(p => {
            if (p && p.active) p.destroy();
          });
        }
      } catch (error) {
        console.warn('Shield visual cleanup error:', error);
      }
      this.shieldVisual = null;
    }
    
    // Clear active effects timers
    if (this.activeEffects.effectTimer) {
      this.activeEffects.effectTimer.remove();
    }
    
    this.spawnTimers.forEach(timer => {
      if (timer) timer.remove();
    });
    this.spawnTimers = [];
  }
}
