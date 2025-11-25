import Phaser from 'phaser';
import { STAGE_CONFIG, BOSS_CONFIG, calculateFinalScore } from '../utils/gameConfig.js';
import { MODERN_COLORS, createModernTextStyle, createModernPanel, createModernBackground, createModernGrid } from '../utils/modernStyle.js';
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
    
    // Skill system
    this.skillCooldown = 0;
    this.skillCooldownMax = 10000; // 10 seconds
    this.skillActive = false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Resume physics if it was paused
    if (this.physics.world.isPaused) {
      this.physics.resume();
    }

    // Modern gradient background
    createModernBackground(this, width, height);
    
    // Subtle grid overlay
    createModernGrid(this, width, height);

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

    // Player with modern design
    this.player = this.add.rectangle(width / 2, height - 80, 40, 40, MODERN_COLORS.accentTertiary);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setImmovable(true);
    
    // Player subtle glow
    this.playerGlow = this.add.rectangle(this.player.x, this.player.y, 44, 44, MODERN_COLORS.accentTertiary, 0.2);
    this.playerGlow.setDepth(-1);

    // Modern UI Panel
    this.createUIPanel(width, height);

    // UI Text - Modern, clean design (above panels)
    const fontSize = isMobile ? 14 : 18;
    const uiX = isMobile ? 12 : 20;
    const uiYSpacing = isMobile ? 22 : 28;
    const uiY = isMobile ? 14 : 22;
    
    this.scoreText = this.add.text(uiX, uiY, 'SCORE: 0', createModernTextStyle(fontSize, '#ffffff', '600'))
      .setDepth(1000);

    this.stageText = this.add.text(uiX, uiY + uiYSpacing, 'STAGE: 1', createModernTextStyle(fontSize, '#ffffff', '600'))
      .setDepth(1000);

    this.timeText = this.add.text(uiX, uiY + uiYSpacing * 2, 'TIME: 00:00', createModernTextStyle(fontSize, '#ffffff', '500'))
      .setDepth(1000);

    // Health display
    const healthX = isMobile ? width - 12 : width - 20;
    const healthY = uiY;
    this.healthText = this.add.text(healthX, healthY, `HP: ${this.playerHealth}/${this.maxHealth}`, 
      createModernTextStyle(fontSize, '#ffffff', '600'))
      .setOrigin(1, 0)
      .setDepth(1000);

    // Weapon display
    const weaponX = isMobile ? width - 12 : width - 20;
    const weaponY = uiY + uiYSpacing;
    this.weaponText = this.add.text(weaponX, weaponY, `WP: ${this.currentWeapon.name}`, 
      createModernTextStyle(isMobile ? 12 : 16, '#ffffff', '500'))
      .setOrigin(1, 0)
      .setDepth(1000);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Mobile touch controls
    this.touchControls = {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
      skill: false
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
    this.timeText.setText(`TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);

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
    
    // Keep player in bounds - 더 넓은 공간 활용
    const { width, height } = this.cameras.main;
    const topBound = isMobile ? 70 : 100;
    const bottomBound = isMobile ? height - 160 : height - 20;
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, width - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, topBound, bottomBound);
    
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
    
    // Skill activation - keyboard (X key) or touch
    const xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    if ((xKey.isDown && !this.skillActive && this.skillCooldown <= 0) || 
        (this.touchControls.skill && !this.skillActive && this.skillCooldown <= 0)) {
      this.activateSkill();
      this.touchControls.skill = false; // Reset after activation
    }
    
    // Update skill cooldown
    if (this.skillCooldown > 0) {
      this.skillCooldown -= this.sys.game.loop.delta;
      if (this.skillCooldown < 0) this.skillCooldown = 0;
      
      // Update cooldown indicator
      if (this.skillCooldownIndicator && this.skillButton) {
        const cooldownPercent = this.skillCooldown / this.skillCooldownMax;
        this.skillCooldownIndicator.setScale(1, cooldownPercent);
        this.skillCooldownIndicator.setVisible(cooldownPercent > 0);
        
        if (cooldownPercent <= 0 && this.skillPulseTween) {
          this.skillPulseTween.resume();
        }
      }
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

    this.stageText.setText(`STAGE: ${this.currentStage}`);

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
        this.scoreText.setText(`SCORE: ${this.score}`);
        
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
      this.healthText.setText(`HP: ${this.playerHealth}/${this.maxHealth}`);
      
      // Show health restored message - Modern style
      const { width, height } = this.cameras.main;
      const restoreText = this.add.text(width / 2, height / 2, 'HEALTH RESTORED', createModernTextStyle(isMobile ? 32 : 40, '#ffffff', '700'))
        .setOrigin(0.5);
      
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
    
    // Selection panel - Modern design (responsive)
    const panelWidth = isMobile ? width * 0.99 : width * 0.9; // Almost full width on mobile
    const panelHeight = isMobile ? height * 0.80 : height * 0.6; // Taller on mobile
    const panel = createModernPanel(this, width / 2, height / 2, panelWidth, panelHeight, 0.95);
    panel.setStrokeStyle(3, MODERN_COLORS.accentPrimary, 1);
    panel.setDepth(1001);
    
    // Title - Modern style (responsive position)
    const titleY = isMobile ? height * 0.22 : height * 0.25;
    const title = this.add.text(width / 2, titleY, 'SELECT ITEM', createModernTextStyle(isMobile ? 24 : 40, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1002);
    
    // Item buttons - Responsive layout
    const itemButtons = [];
    
    if (isMobile) {
      // Mobile: Full width layout - cards fill the screen
      // Minimal margins for maximum space usage
      const margin = width * 0.02; // 2% margin on each side (minimal)
      const cardSpacing = width * 0.015; // 1.5% spacing between cards (minimal)
      const availableWidth = width - (margin * 2);
      const totalSpacing = cardSpacing * 2; // 2 gaps between 3 cards
      const cardWidth = (availableWidth - totalSpacing) / 3; // Equal width for 3 cards
      const cardHeight = height * 0.38; // 38% of screen height (increased)
      
      const centerY = height * 0.52; // Slightly lower for better fit
      
      selectedItems.forEach((itemType, index) => {
        // Calculate each card's left edge first, then center
        // Card left edge = margin + index * (cardWidth + spacing)
        const cardLeft = margin + (index * (cardWidth + cardSpacing));
        // Card center = left edge + half width
        const x = cardLeft + (cardWidth / 2);
        const y = centerY;
        
        // Item card - ensure it fits, use exact dimensions
        const card = this.add.rectangle(x, y, cardWidth, cardHeight, itemType.color, 0.2);
        card.setStrokeStyle(2, itemType.color, 0.8); // Thinner stroke to prevent overlap
        card.setDepth(1002);
        // Set interactive - use default hit area
        card.setInteractive();
        
        // Item icon - smaller for mobile
        const iconSize = Math.min(cardWidth * 0.18, 20);
        const icon = this.add.circle(x, y - cardHeight * 0.22, iconSize, itemType.color);
        icon.setStrokeStyle(2, itemType.color, 1); // Thinner stroke
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
        
        // Selection number - smaller
        const numText = this.add.text(x, y - cardHeight * 0.38, `${index + 1}`, createModernTextStyle(16, '#ffffff', '700'))
          .setOrigin(0.5).setDepth(1003);
        
        // Item name - compact
        const nameText = this.add.text(x, y + cardHeight * 0.12, itemType.name, createModernTextStyle(10, `#${itemType.color.toString(16).padStart(6, '0')}`, '600'))
          .setOrigin(0.5).setDepth(1003)
          .setWordWrapWidth(cardWidth * 0.85);
        
        // Item description - very compact
        const description = itemType.description || 'UPGRADE';
        const descText = this.add.text(x, y + cardHeight * 0.32, description, createModernTextStyle(8, '#ffffff', '400'))
          .setOrigin(0.5).setDepth(1003)
          .setAlign('center')
          .setWordWrapWidth(cardWidth * 0.8);
        
        // Click handler
        card.on('pointerdown', () => {
          this.selectItem(itemType);
        });
        
        // Touch feedback - keep stroke same size to prevent visual overlap
        card.on('pointerover', () => {
          card.setFillStyle(itemType.color, 0.4);
          card.setStrokeStyle(2, itemType.color, 1); // Keep same stroke width
          icon.setScale(1.15); // Smaller scale to prevent overlap
        });
        
        card.on('pointerout', () => {
          card.setFillStyle(itemType.color, 0.2);
          card.setStrokeStyle(2, itemType.color, 0.8); // Keep same stroke width
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
    } else {
      // Desktop: Responsive horizontal layout - centered
      // Calculate to ensure cards don't overlap and are centered
      const cardWidth = Math.min(200, width * 0.18); // Max 200px or 18% of width
      const cardHeight = Math.min(250, height * 0.4); // Max 250px or 40% of height
      const cardSpacing = Math.max(20, width * 0.03); // At least 20px or 3% of width
      
      // Calculate total width needed for 3 cards + 2 gaps
      const totalCardsWidth = (cardWidth * 3) + (cardSpacing * 2);
      // Center the entire group
      const startX = (width - totalCardsWidth) / 2;
      
      const centerY = height / 2;
      
      selectedItems.forEach((itemType, index) => {
        // Calculate each card's left edge first, then center
        const cardLeft = startX + (index * (cardWidth + cardSpacing));
        const x = cardLeft + (cardWidth / 2);
        const y = centerY;
        
        // Item card - use exact dimensions
        const card = this.add.rectangle(x, y, cardWidth, cardHeight, itemType.color, 0.2);
        card.setStrokeStyle(2, itemType.color, 0.8); // Thinner stroke
        card.setDepth(1002);
        // Set interactive - use default hit area
        card.setInteractive();
        
        // Item icon - responsive size
        const iconSize = Math.min(40, cardWidth * 0.2);
        const icon = this.add.circle(x, y - cardHeight * 0.16, iconSize, itemType.color);
        icon.setStrokeStyle(2, itemType.color, 1);
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
        
        // Selection number
        const numText = this.add.text(x, y - cardHeight * 0.4, `${index + 1}`, createModernTextStyle(Math.min(26, cardWidth / 8), '#ffffff', '700'))
          .setOrigin(0.5).setDepth(1003);
        
        // Item name
        const nameText = this.add.text(x, y + cardHeight * 0.08, itemType.name, createModernTextStyle(Math.min(18, cardWidth / 11), `#${itemType.color.toString(16).padStart(6, '0')}`, '600'))
          .setOrigin(0.5).setDepth(1003)
          .setWordWrapWidth(cardWidth * 0.85);
        
        // Item description
        const description = itemType.description || 'UPGRADE';
        const descText = this.add.text(x, y + cardHeight * 0.24, description, createModernTextStyle(Math.min(12, cardWidth / 16), '#ffffff', '400'))
          .setOrigin(0.5).setDepth(1003)
          .setAlign('center')
          .setWordWrapWidth(cardWidth * 0.8);
        
        // Click handler
        card.on('pointerdown', () => {
          this.selectItem(itemType);
        });
        
        // Hover effect - keep stroke same size to prevent visual overlap
        card.on('pointerover', () => {
          card.setFillStyle(itemType.color, 0.4);
          card.setStrokeStyle(2, itemType.color, 1); // Keep same stroke width
          icon.setScale(1.15); // Smaller scale to prevent overlap
        });
        
        card.on('pointerout', () => {
          card.setFillStyle(itemType.color, 0.2);
          card.setStrokeStyle(2, itemType.color, 0.8); // Keep same stroke width
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
    }
    
    // Instructions - Modern style (responsive position)
    const instructionY = isMobile ? height * 0.88 : height * 0.75;
    const instructionText = this.add.text(width / 2, instructionY, isMobile ? 'Tap to select' : 'Click to select | [1] [2] [3] keys', createModernTextStyle(isMobile ? 12 : 16, '#ffffff', '500'))
      .setOrigin(0.5).setDepth(1003);
    
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
      case 'permanentUpgradeWeapon':
        this.permanentUpgradeWeapon();
        break;
      case 'permanentRestoreHealth':
        this.permanentRestoreHealth();
        break;
      case 'permanentIncreaseFireRate':
        this.permanentIncreaseFireRate();
        break;
      case 'permanentIncreaseMaxHealth':
        this.permanentIncreaseMaxHealth();
        break;
      case 'permanentIncreaseScoreMultiplier':
        this.permanentIncreaseScoreMultiplier();
        break;
    }
    
    // Show selection effect - Modern style
    const { width, height } = this.cameras.main;
    const effectText = this.add.text(width / 2, height / 2, `${itemType.name} SELECTED`, createModernTextStyle(isMobile ? 28 : 36, `#${itemType.color.toString(16).padStart(6, '0')}`, '700'))
      .setOrigin(0.5).setDepth(1000);
    
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
      this.weaponText.setText(`WP: ${this.currentWeapon.name}`);
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
      
      this.weaponText.setText(`WP: ${this.currentWeapon.name}`);
      this.weaponText.setColor(`#${this.currentWeapon.color.toString(16).padStart(6, '0')}`);
      
      this.showItemMessage('WEAPON PERMANENTLY UPGRADED!', this.currentWeapon.color);
    }
  }

  permanentRestoreHealth() {
    // Restore health to max
    this.playerHealth = this.maxHealth;
    this.healthText.setText(`HP: ${this.playerHealth}/${this.maxHealth}`);
    this.showItemMessage('HEALTH RESTORED!', ITEM_TYPES.HEALTH.color);
  }

  permanentIncreaseMaxHealth() {
    // Permanently increase max health
    this.maxHealth += 1;
    this.playerHealth += 1; // Also increase current health
    this.healthText.setText(`HP: ${this.playerHealth}/${this.maxHealth}`);
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
    const message = this.add.text(width / 2, height * 0.3, text, createModernTextStyle(isMobile ? 24 : 28, `#${color.toString(16).padStart(6, '0')}`, '700'))
      .setOrigin(0.5);
    
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
      this.healthText.setText(`HP: ${this.playerHealth}/${this.maxHealth}`);
      
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
      this.scoreText.setText(`SCORE: ${this.score}`);
    
    // Stage clear message - Modern style
    const { width, height } = this.cameras.main;
    const clearText = this.add.text(width / 2, height / 2, `STAGE ${this.currentStage} CLEAR`, createModernTextStyle(isMobile ? 40 : 56, '#ffffff', '700'))
      .setOrigin(0.5);
    
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
    // Top panel - Modern design (behind text)
    const topPanelHeight = isMobile ? 65 : 110;
    const topPanel = createModernPanel(this, width / 2, topPanelHeight / 2, width, topPanelHeight, 0.7);
    topPanel.setDepth(100);
    
    // Bottom panel - Modern design (behind controls)
    const bottomPanelHeight = isMobile ? 160 : 35;
    const bottomPanel = createModernPanel(this, width / 2, height - bottomPanelHeight / 2, width, bottomPanelHeight, 0.7);
    bottomPanel.setDepth(100);
  }


  createMobileControls() {
    const { width, height } = this.cameras.main;
    this.mobileControls = {};

    // Control button size and spacing (optimized for mobile)
    const buttonSize = isMobile ? 55 : 50;
    const buttonSpacing = isMobile ? 65 : 60;
    const controlAlpha = 0.85;
    const controlColor = MODERN_COLORS.accentPrimary;

    // D-Pad (left side, bottom - fixed position)
    const dpadX = buttonSize + 15;
    const dpadY = height - buttonSize - 15;
    
    // Up button
    const upBtn = this.add.rectangle(dpadX, dpadY - buttonSpacing, buttonSize, buttonSize, controlColor, controlAlpha);
    upBtn.setStrokeStyle(2, controlColor, 1);
    upBtn.setInteractive();
    upBtn.setDepth(1000);
    const upText = this.add.text(dpadX, dpadY - buttonSpacing, '↑', createModernTextStyle(24, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1001);
    upText.setInteractive(false); // Make text non-interactive
    
    upBtn.on('pointerdown', () => { this.touchControls.up = true; });
    upBtn.on('pointerup', () => { this.touchControls.up = false; });
    upBtn.on('pointerout', () => { this.touchControls.up = false; });

    // Down button
    const downBtn = this.add.rectangle(dpadX, dpadY + buttonSpacing, buttonSize, buttonSize, controlColor, controlAlpha);
    downBtn.setStrokeStyle(2, controlColor, 1);
    downBtn.setInteractive();
    downBtn.setDepth(1000);
    const downText = this.add.text(dpadX, dpadY + buttonSpacing, '↓', createModernTextStyle(24, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1001);
    downText.setInteractive(false); // Make text non-interactive
    
    downBtn.on('pointerdown', () => { this.touchControls.down = true; });
    downBtn.on('pointerup', () => { this.touchControls.down = false; });
    downBtn.on('pointerout', () => { this.touchControls.down = false; });

    // Left button
    const leftBtn = this.add.rectangle(dpadX - buttonSpacing, dpadY, buttonSize, buttonSize, controlColor, controlAlpha);
    leftBtn.setStrokeStyle(2, controlColor, 1);
    leftBtn.setInteractive();
    leftBtn.setDepth(1000);
    const leftText = this.add.text(dpadX - buttonSpacing, dpadY, '←', createModernTextStyle(24, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1001);
    leftText.setInteractive(false); // Make text non-interactive
    
    leftBtn.on('pointerdown', () => { this.touchControls.left = true; });
    leftBtn.on('pointerup', () => { this.touchControls.left = false; });
    leftBtn.on('pointerout', () => { this.touchControls.left = false; });

    // Right button
    const rightBtn = this.add.rectangle(dpadX + buttonSpacing, dpadY, buttonSize, buttonSize, controlColor, controlAlpha);
    rightBtn.setStrokeStyle(2, controlColor, 1);
    rightBtn.setInteractive();
    rightBtn.setDepth(1000);
    const rightText = this.add.text(dpadX + buttonSpacing, dpadY, '→', createModernTextStyle(24, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1001);
    rightText.setInteractive(false); // Make text non-interactive
    
    rightBtn.on('pointerdown', () => { this.touchControls.right = true; });
    rightBtn.on('pointerup', () => { this.touchControls.right = false; });
    rightBtn.on('pointerout', () => { this.touchControls.right = false; });

    // Fire button (right side, bottom - fixed position)
    const fireBtnSize = isMobile ? 75 : 70;
    const fireBtnX = width - fireBtnSize - 15;
    const fireBtnY = height - fireBtnSize - 15;
    const fireBtn = this.add.circle(fireBtnX, fireBtnY, fireBtnSize / 2, MODERN_COLORS.accentWarning, controlAlpha);
    fireBtn.setStrokeStyle(3, MODERN_COLORS.accentWarning, 1);
    fireBtn.setInteractive();
    fireBtn.setDepth(1000);
    const fireText = this.add.text(fireBtnX, fireBtnY, 'FIRE', createModernTextStyle(16, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1001);
    fireText.setInteractive(false); // Make text non-interactive
    
    fireBtn.on('pointerdown', () => { this.touchControls.shoot = true; });
    fireBtn.on('pointerup', () => { this.touchControls.shoot = false; });
    fireBtn.on('pointerout', () => { this.touchControls.shoot = false; });

    // Store references for cleanup
    this.mobileControls = {
      up: upBtn,
      down: downBtn,
      left: leftBtn,
      right: rightBtn,
      fire: fireBtn
    };

    // Add pulsing animation to fire button
    this.tweens.add({
      targets: fireBtn,
      scale: { from: 0.95, to: 1.05 },
      alpha: { from: 0.6, to: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Skill button (above fire button - fixed position)
    const skillBtnSize = isMobile ? 65 : 60;
    const skillBtnX = width - skillBtnSize - 15;
    const skillBtnY = height - fireBtnSize - skillBtnSize - 25;
    const skillBtn = this.add.circle(skillBtnX, skillBtnY, skillBtnSize / 2, MODERN_COLORS.accentSecondary, controlAlpha);
    skillBtn.setStrokeStyle(3, MODERN_COLORS.accentSecondary, 1);
    skillBtn.setInteractive();
    skillBtn.setDepth(1000);
    
    // Skill button text
    const skillText = this.add.text(skillBtnX, skillBtnY, 'SKILL', createModernTextStyle(12, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1001);
    skillText.setInteractive(false); // Make text non-interactive
    
    // Cooldown indicator
    const cooldownCircle = this.add.circle(skillBtnX, skillBtnY, skillBtnSize / 2, 0x000000, 0.5);
    cooldownCircle.setDepth(1002);
    cooldownCircle.setVisible(false);
    this.skillCooldownIndicator = cooldownCircle;
    this.skillButton = skillBtn;
    this.skillButtonText = skillText;
    
    skillBtn.on('pointerdown', () => { 
      if (!this.skillActive && this.skillCooldown <= 0) {
        this.touchControls.skill = true;
      }
    });
    skillBtn.on('pointerup', () => { 
      this.touchControls.skill = false;
    });
    skillBtn.on('pointerout', () => { 
      this.touchControls.skill = false;
    });

    // Store skill button reference
    this.mobileControls.skill = skillBtn;
    
    // Add pulsing animation to skill button when ready
    this.skillPulseTween = this.tweens.add({
      targets: skillBtn,
      scale: { from: 0.95, to: 1.05 },
      alpha: { from: 0.6, to: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true
    });
  }
  
  activateSkill() {
    if (this.skillActive || this.skillCooldown > 0) return;
    
    this.skillActive = true;
    this.skillCooldown = this.skillCooldownMax;
    
    // Skill effect: Rapid fire burst + screen clear
    const { width, height } = this.cameras.main;
    
    // Visual effect
    const skillEffect = this.add.rectangle(width / 2, height / 2, width, height, MODERN_COLORS.accentSecondary, 0.25);
    skillEffect.setDepth(999);
    this.tweens.add({
      targets: skillEffect,
      alpha: 0,
      duration: 300,
      onComplete: () => skillEffect.destroy()
    });
    
    // Rapid fire burst
    let burstCount = 0;
    const burstInterval = setInterval(() => {
      if (burstCount < 10) {
        this.shoot();
        burstCount++;
      } else {
        clearInterval(burstInterval);
        this.skillActive = false;
      }
    }, 50);
    
    // Clear nearby enemy bullets
    this.enemyBullets.children.entries.forEach(bullet => {
      if (bullet && bullet.active) {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, bullet.x, bullet.y);
        if (distance < 200) {
          bullet.destroy();
        }
      }
    });
    
    // Update skill button visual
    if (this.skillCooldownIndicator) {
      this.skillCooldownIndicator.setVisible(true);
      this.skillPulseTween.pause();
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
