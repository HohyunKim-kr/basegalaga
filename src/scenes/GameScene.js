import Phaser from 'phaser';
import { STAGE_CONFIG, BOSS_CONFIG, calculateFinalScore } from '../utils/gameConfig.js';
import { MODERN_COLORS, createModernTextStyle, createModernPanel, createModernBackground, createModernGrid } from '../utils/modernStyle.js';
import { WEAPON_PATTERNS, WEAPON_UPGRADE_ORDER } from '../utils/weaponPatterns.js';
import { ITEM_TYPES, getRandomItem } from '../utils/items.js';
import { isMobile } from '../main.js';
import { TouchControlManager } from '../managers/TouchControlManager.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    console.log('=== GameScene preload 시작 ===');
    
    // 몬스터 이미지 로드
    // 이미지 파일은 public/enemies/ 폴더에 넣어주세요
    // 예: public/enemies/enemy1.png, enemy2.png, enemy3.png, enemy4.png
    const imagePaths = {
      'enemy1': '/enemies/enemy1.png',
      'enemy2': '/enemies/enemy2.png',
      'enemy3': '/enemies/enemy3.png',
      'enemy4': '/enemies/enemy4.png',
      'boss1': '/enemies/boss1.png',
      'boss2': '/enemies/boss2.png'
    };
    
    Object.entries(imagePaths).forEach(([key, path]) => {
      console.log(`이미지 로드 시도: ${key} -> ${path}`);
      this.load.image(key, path);
    });
    
    // 이미지 로드 에러 처리
    this.load.on('fileerror', (file) => {
      console.error('❌ 이미지 로드 실패:', file.key, file.url, file);
    });
    
    // 이미지 로드 완료 확인
    this.load.on('complete', () => {
      console.log('=== 이미지 로드 완료 ===');
      // 로드된 이미지 확인
      Object.keys(imagePaths).forEach(key => {
        if (this.textures.exists(key)) {
          const texture = this.textures.get(key);
          console.log(`✓ ${key} 이미지 로드됨 (${texture.width}x${texture.height})`);
        } else {
          console.error(`✗ ${key} 이미지 로드 실패 - 파일 경로 확인 필요: ${imagePaths[key]}`);
        }
      });
    });
    
    // 개별 파일 로드 완료 확인
    this.load.on('filecomplete', (key, type, data) => {
      console.log(`✓ 파일 로드 완료: ${key} (${type})`);
    });
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

    // 이미지 로드 상태 확인 및 재로드
    const imageKeys = ['enemy1', 'enemy2', 'enemy3', 'enemy4', 'boss1', 'boss2'];
    const imagePaths = {
      'enemy1': '/enemies/enemy1.png',
      'enemy2': '/enemies/enemy2.png',
      'enemy3': '/enemies/enemy3.png',
      'enemy4': '/enemies/enemy4.png',
      'boss1': '/enemies/boss1.png',
      'boss2': '/enemies/boss2.png'
    };
    
    const missingImages = [];
    
    console.log('=== 이미지 로드 상태 확인 ===');
    imageKeys.forEach(key => {
      if (this.textures.exists(key)) {
        try {
          const texture = this.textures.get(key);
          console.log(`✓ ${key} 이미지 존재 (${texture.width}x${texture.height})`);
        } catch (error) {
          console.warn(`⚠ ${key} 텍스처 확인 중 오류:`, error);
          missingImages.push(key);
        }
      } else {
        console.warn(`✗ ${key} 이미지 없음 - 다시 로드 시도`);
        missingImages.push(key);
      }
    });
    
    // 이미지가 없으면 다시 로드
    if (missingImages.length > 0) {
      console.log('누락된 이미지 재로드 시작:', missingImages);
      
      // 기존 리스너 제거
      this.load.removeAllListeners();
      
      // 모든 이미지를 다시 로드 (캐시 무시)
      imageKeys.forEach(key => {
        const path = imagePaths[key];
        console.log(`이미지 재로드: ${key} -> ${path}`);
        // 기존 텍스처가 있으면 제거
        if (this.textures.exists(key)) {
          this.textures.remove(key);
        }
        this.load.image(key, path);
      });
      
      // 에러 처리
      this.load.once('fileerror', (file) => {
        console.error('❌ 이미지 재로드 실패:', file.key, file.url);
      });
      
      // 완료 처리
      this.load.once('complete', () => {
        console.log('=== 이미지 재로드 완료 ===');
        // 재로드된 이미지 확인
        let allLoaded = true;
        imageKeys.forEach(key => {
          if (this.textures.exists(key)) {
            try {
              const texture = this.textures.get(key);
              console.log(`✓ ${key} 이미지 로드됨 (${texture.width}x${texture.height})`);
            } catch (error) {
              console.error(`✗ ${key} 텍스처 접근 실패:`, error);
              allLoaded = false;
            }
          } else {
            console.error(`✗ ${key} 이미지 여전히 없음`);
            allLoaded = false;
          }
        });
        
        if (allLoaded) {
          console.log('모든 이미지 로드 완료 - 게임 초기화 시작');
          // 이미지 로드 완료 후 게임 초기화
          this.initializeGame();
        } else {
          console.error('일부 이미지 로드 실패 - 게임은 계속 진행하지만 이미지 없이 표시됩니다');
          this.initializeGame();
        }
      });
      
      // 개별 파일 로드 완료 확인
      this.load.once('filecomplete', (key, type) => {
        console.log(`✓ 파일 재로드 완료: ${key} (${type})`);
      });
      
      this.load.start();
      return; // 이미지 로드 중이면 여기서 종료
    }

    // 이미지가 모두 로드되어 있으면 게임 초기화
    console.log('모든 이미지가 이미 로드되어 있음 - 게임 초기화 시작');
    this.initializeGame();
  }
  
  initializeGame() {
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
    // Phaser 입력 시스템에서 제외
    if (this.player.setInteractive) {
      this.player.setInteractive(false);
    }
    
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

    // Phaser 입력 시스템 완전 비활성화 (DOM 이벤트만 사용)
    this.input.enabled = false;
    if (this.input.mouse) this.input.mouse.enabled = false;
    if (this.input.touch) {
      this.input.touch.enabled = false;
      // Phaser의 터치 이벤트 리스너 제거
      if (this.input.touch.touchStartCallback) {
        this.input.touch.touchStartCallback = null;
      }
      if (this.input.touch.touchMoveCallback) {
        this.input.touch.touchMoveCallback = null;
      }
      if (this.input.touch.touchEndCallback) {
        this.input.touch.touchEndCallback = null;
      }
    }
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    
    // Phaser의 입력 업데이트 함수 오버라이드하여 아무것도 하지 않도록
    if (this.input && this.input.update) {
      const originalUpdate = this.input.update.bind(this.input);
      this.input.update = function() {
        // Phaser 입력 업데이트 비활성화
        return;
      };
    }
    
    // Touch controls (모바일 전용 - 키보드 컨트롤 제거)
    this.touchControlManager = new TouchControlManager(this);
    this.touchControlManager.createControls();
    
    // Get controls reference for easier access
    this.touchControls = this.touchControlManager.getControls();
    
    // 디버깅: 컨트롤이 제대로 생성되었는지 확인
    console.log('GameScene: TouchControlManager created', this.touchControlManager);
    console.log('GameScene: TouchControls', this.touchControls);

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    // Boss 충돌 감지는 spawnBoss 후에 등록됨
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.hitPlayer, null, this);

    // Start timer
    this.startTime = this.time.now;

    // Start first stage
    this.startStage();
  }

  update(time) {
    if (this.gameOver) return;
    
    // 터치 컨트롤이 없으면 리턴
    if (!this.touchControls) {
      return;
    }

    // Update elapsed time
    this.elapsedTime = time - this.startTime;
    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    if (this.timeText) {
    this.timeText.setText(`TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }

    // 플레이어 이동 - 터치 전용 (모바일)
    const moveSpeed = 5;
    
    // 터치 위치로 직접 이동 (화면 터치)
    if (this.touchControls.isTouching && this.touchControls.touchX !== null && this.touchControls.touchY !== null) {
      const dx = this.touchControls.touchX - this.player.x;
      const dy = this.touchControls.touchY - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) { // 목표 지점에 도달할 때까지 이동
        const moveX = (dx / distance) * moveSpeed;
        const moveY = (dy / distance) * moveSpeed;
        this.player.x += moveX;
        this.player.y += moveY;
      }
    }
    
    // D-Pad 버튼으로 이동
      if (this.touchControls.left) {
        this.player.x -= moveSpeed;
      }
      if (this.touchControls.right) {
        this.player.x += moveSpeed;
      }
      if (this.touchControls.up) {
        this.player.y -= moveSpeed;
      }
      if (this.touchControls.down) {
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

    // Shooting (continuous fire) - 터치 전용
    if (this.touchControls && this.touchControls.shoot && time - this.lastShotTime > (this.fireRate / this.fireRateMultiplier)) {
      this.shoot();
      this.lastShotTime = time;
    }
    
    // Skill activation - 터치 전용
    if (this.touchControls && this.touchControls.skill && !this.skillActive && this.skillCooldown <= 0) {
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

    // Enemy AI - enemyFormation 배열 사용 (Enemy 객체 직접 접근)
    this.enemyFormation.forEach(enemy => {
      if (!enemy || !enemy.active || !enemy.sprite || !enemy.sprite.active) return;
      
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
        // Enemy 클래스의 shouldDive 메서드 사용
        if (enemy && typeof enemy.shouldDive === 'function' && enemy.shouldDive(time)) {
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
        
        // Enemy 클래스를 사용하여 이미지 적용
        const enemy = new Enemy(this, x, y, {
          enemyColor: config.enemyColor,
          enemyImage: config.enemyImage,
          enemyHealth: config.enemyHealth,
          enemyDamage: config.enemyDamage,
          enemyPoints: config.enemyPoints
        });
        
        this.enemies.add(enemy.sprite);
        this.enemyFormation.push(enemy);
        enemy.startFormationMovement(enemyIndex);
        enemyIndex++;
      }
    }

    // Start formation movement
    this.startFormationMovement();
  }

  startFormationMovement() {
    // Enemy 클래스의 startFormationMovement를 사용
    // 이미 Enemy 클래스에서 처리하므로 여기서는 호출만 하거나 제거
    // Enemy 생성 시 이미 startFormationMovement가 호출됨
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
    
    // Boss 클래스를 사용하여 이미지 적용
    this.boss = new Boss(this, width / 2, 100, bossConfig);
    
    // Boss health bar는 Boss 클래스에서 생성하므로 참조만 저장
    this.bossHealthBar = this.boss.healthBar;
    
    // Boss 충돌 감지 등록
    if (this.boss && this.boss.sprite) {
      this.physics.add.overlap(this.bullets, this.boss.sprite, this.hitBoss, null, this);
    }
  }

  updateBossPattern(time) {
    // Boss 클래스의 updatePattern 메서드 사용
    if (this.boss && typeof this.boss.updatePattern === 'function') {
      this.boss.updatePattern(time);
    }
  }

  updateBossHealthBar() {
    // Boss 클래스의 updateHealthBar 메서드 사용
    if (this.boss && typeof this.boss.updateHealthBar === 'function') {
      this.boss.updateHealthBar();
    }
    // healthBar 참조 업데이트
    if (this.boss && this.boss.healthBar) {
      this.bossHealthBar = this.boss.healthBar;
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
      const bulletColor = config.enemyColor; // Enemy 클래스의 config에서 색상 가져오기
    
    // Vary bullet patterns based on stage
    if (stage <= 2) {
      // Early stages: simple straight or slightly aimed
      const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, bulletColor);
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
          const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, bulletColor);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const spread = (i - 1) * 0.3;
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + spread;
          bullet.body.setVelocityX(Math.cos(angle) * 100);
          bullet.body.setVelocityY(Math.sin(angle) * 100 + config.enemySpeed * 0.3);
        }
      } else {
        // Aimed shot
        const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, bulletColor);
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
          const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, bulletColor);
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
          const bullet = this.add.rectangle(enemy.x + (i - 0.5) * 15, enemy.y + 20, 5, 15, bulletColor);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
          bullet.body.setVelocityX(Math.cos(angle) * 120);
          bullet.body.setVelocityY(Math.sin(angle) * 120 + config.enemySpeed * 0.4);
        }
      } else {
        // Aimed shot with prediction
        const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 5, 15, bulletColor);
        this.physics.add.existing(bullet);
        this.enemyBullets.add(bullet);
        // Predict player movement (터치 컨트롤 기반)
        const predictX = this.player.x + (this.touchControls?.left ? -50 : this.touchControls?.right ? 50 : 0);
        const predictY = this.player.y + (this.touchControls?.up ? -50 : this.touchControls?.down ? 50 : 0);
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
          const predictX = this.player.x + (this.touchControls?.left ? -80 : this.touchControls?.right ? 80 : 0);
          const predictY = this.player.y + (this.touchControls?.up ? -80 : this.touchControls?.down ? 80 : 0);
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

  hitEnemy(bullet, enemySprite) {
    if (!enemySprite || !bullet || !enemySprite.active || !bullet.active) return;
    
    try {
      // sprite에서 Enemy 객체 참조 가져오기
      const enemy = enemySprite.enemyRef;
      if (!enemy) {
        console.warn('Enemy 객체 참조 없음');
        return;
      }
      
      bullet.destroy();
      
      // Enemy 클래스의 takeDamage 메서드 사용
      const isDead = enemy.takeDamage(1);
      
      if (isDead) {
        // Calculate score with multiplier
        const basePoints = enemy.points || 10;
        const finalPoints = Math.floor(basePoints * this.activeEffects.scoreMultiplier);
        this.score += finalPoints;
        this.enemiesKilled++;
        this.scoreText.setText(`SCORE: ${this.score}`);
        
        // enemyFormation에서 제거
        const index = this.enemyFormation.indexOf(enemy);
        if (index > -1) {
          this.enemyFormation.splice(index, 1);
        }
        
        // Enemy 클래스의 destroy 메서드 사용
        enemy.destroy();
      }
    } catch (error) {
      console.warn('Hit enemy error:', error);
    }
  }

  hitBoss(bullet, bossSprite) {
    if (!bossSprite || !bullet || !bossSprite.active || !bullet.active) return;
    
    try {
      // sprite에서 Boss 객체 참조 가져오기
      const boss = this.boss;
      if (!boss) {
        console.warn('Boss 객체 없음');
        return;
      }
      
      bullet.destroy();
      
      // Boss 클래스의 takeDamage 메서드 사용
      const isDead = boss.takeDamage(1);
      this.updateBossHealthBar();
      
      if (isDead) {
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
      // Boss 클래스의 destroy 메서드 사용
      if (boss.destroy) {
        boss.destroy();
      }
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
    
    // 터치 컨트롤 숨기기
    if (this.touchControlManager) {
      this.touchControlManager.hide();
    }
    
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
    const panelWidth = isMobile ? width * 0.99 : width * 0.9;
    const panelHeight = isMobile ? height * 0.80 : height * 0.6;
    const panel = createModernPanel(this, width / 2, height / 2, panelWidth, panelHeight, 0.95);
    panel.setStrokeStyle(3, MODERN_COLORS.accentPrimary, 1);
    panel.setDepth(1001);
    
    // Title
    const titleY = isMobile ? height * 0.22 : height * 0.25;
    const title = this.add.text(width / 2, titleY, 'SELECT ITEM', createModernTextStyle(isMobile ? 24 : 40, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1002);
    
    // Item cards
    const itemButtons = [];
    const cardAreas = [];
    
    const margin = width * 0.02;
    const cardSpacing = width * 0.015;
      const availableWidth = width - (margin * 2);
    const totalSpacing = cardSpacing * 2;
    const cardWidth = isMobile ? (availableWidth - totalSpacing) / 3 : Math.min(200, width * 0.18);
    const cardHeight = isMobile ? height * 0.38 : Math.min(250, height * 0.4);
    const centerY = isMobile ? height * 0.52 : height / 2;
    const startX = isMobile ? margin : (width - (cardWidth * 3 + cardSpacing * 2)) / 2;
      
      selectedItems.forEach((itemType, index) => {
      const cardLeft = startX + (index * (cardWidth + cardSpacing));
        const x = cardLeft + (cardWidth / 2);
        const y = centerY;
        
      // 카드 영역 저장
      cardAreas.push({
        left: x - cardWidth / 2,
        right: x + cardWidth / 2,
        top: y - cardHeight / 2,
        bottom: y + cardHeight / 2,
        itemType: itemType
      });
      
      // 카드 시각적 요소
        const card = this.add.rectangle(x, y, cardWidth, cardHeight, itemType.color, 0.2);
      card.setStrokeStyle(2, itemType.color, 0.8);
        card.setDepth(1002);
        
      const iconSize = isMobile ? Math.min(cardWidth * 0.18, 20) : Math.min(40, cardWidth * 0.2);
        const icon = this.add.circle(x, y - cardHeight * 0.22, iconSize, itemType.color);
      icon.setStrokeStyle(2, itemType.color, 1);
        icon.setDepth(1003);
        
        this.tweens.add({
          targets: icon,
          scale: { from: 0.9, to: 1.1 },
          alpha: { from: 0.7, to: 1 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
      const numText = this.add.text(x, y - cardHeight * 0.38, `${index + 1}`, createModernTextStyle(isMobile ? 16 : 26, '#ffffff', '700'))
          .setOrigin(0.5).setDepth(1003);
        
      const nameText = this.add.text(x, y + cardHeight * 0.12, itemType.name, createModernTextStyle(isMobile ? 10 : 18, `#${itemType.color.toString(16).padStart(6, '0')}`, '600'))
          .setOrigin(0.5).setDepth(1003)
          .setWordWrapWidth(cardWidth * 0.85);
        
        const description = itemType.description || 'UPGRADE';
      const descText = this.add.text(x, y + cardHeight * 0.32, description, createModernTextStyle(isMobile ? 8 : 12, '#ffffff', '400'))
          .setOrigin(0.5).setDepth(1003)
          .setAlign('center')
          .setWordWrapWidth(cardWidth * 0.8);
        
      itemButtons.push({ card, icon, nameText, descText, numText, itemType });
    });
    
    // DOM 터치 이벤트로 카드 선택 처리
    const canvas = this.game.canvas;
    const self = this;
    
    const getPos = (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let clientX, clientY;
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };
    
    const onItemTouch = (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      const pos = getPos(event);
      console.log('Item selection touch:', pos);
      
      for (const area of cardAreas) {
        if (pos.x >= area.left && pos.x <= area.right &&
            pos.y >= area.top && pos.y <= area.bottom) {
          console.log('Item selected:', area.itemType.name);
          self.selectItem(area.itemType);
          return;
        }
      }
    };
    
    // capture: true로 등록하여 다른 이벤트보다 먼저 처리
    canvas.addEventListener('touchstart', onItemTouch, { passive: false, capture: true });
    canvas.addEventListener('mousedown', onItemTouch, { capture: true });
    
    // document 레벨에서도 등록 (더 확실하게)
    if (typeof document !== 'undefined') {
      document.addEventListener('touchstart', onItemTouch, { passive: false, capture: true });
      document.addEventListener('mousedown', onItemTouch, { capture: true });
    }
    
    // Instructions
    const instructionY = isMobile ? height * 0.88 : height * 0.75;
    const instructionText = this.add.text(width / 2, instructionY, 'Tap to select', createModernTextStyle(isMobile ? 12 : 16, '#ffffff', '500'))
      .setOrigin(0.5).setDepth(1003);
    
    this.itemSelectionUI = {
      overlay,
      panel,
      title,
      instructionText,
      itemButtons,
      selectedItems,
      onItemTouch // 이벤트 핸들러 저장
    };
  }

  selectItem(itemType) {
    if (!this.itemSelectionActive) return;
    
    // DOM 이벤트 리스너 먼저 제거 (itemSelectionUI가 null이 되기 전에)
    const canvas = this.game.canvas;
    if (this.itemSelectionUI && this.itemSelectionUI.onItemTouch) {
      const onItemTouch = this.itemSelectionUI.onItemTouch;
      canvas.removeEventListener('touchstart', onItemTouch, { capture: true });
      canvas.removeEventListener('mousedown', onItemTouch, { capture: true });
      
      // document 레벨 리스너도 제거
      if (typeof document !== 'undefined') {
        document.removeEventListener('touchstart', onItemTouch, { capture: true });
        document.removeEventListener('mousedown', onItemTouch, { capture: true });
      }
    }
    
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
    
    // 터치 컨트롤 다시 표시
    if (this.touchControlManager) {
      this.touchControlManager.show();
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

  hitPlayer(player, enemySpriteOrBullet) {
    if (this.gameOver) return;
    
    // Shield protects from damage
    if (this.activeEffects.shield) {
      if (enemySpriteOrBullet.body && enemySpriteOrBullet.body.velocity) {
        if (this.enemyBullets.contains(enemySpriteOrBullet)) {
          enemySpriteOrBullet.destroy();
        }
      }
      return; // Shield blocks damage
    }
    
    if (enemySpriteOrBullet && enemySpriteOrBullet.active) {
      // Enemy sprite인 경우 Enemy 객체에서 damage 가져오기
      let damage = 1;
      if (enemySpriteOrBullet.enemyRef) {
        // Enemy 객체가 있으면 damage 가져오기
        damage = enemySpriteOrBullet.enemyRef.damage || 1;
      } else if (enemySpriteOrBullet.damage) {
        // 직접 damage 속성이 있으면 사용 (bullet 등)
        damage = enemySpriteOrBullet.damage;
      }
      
      this.playerHealth = Math.max(0, this.playerHealth - damage);
      this.healthText.setText(`HP: ${this.playerHealth}/${this.maxHealth}`);
      
      if (enemySpriteOrBullet.body && enemySpriteOrBullet.body.velocity) {
        // Only destroy bullets, not enemies (enemies bounce)
        if (this.enemyBullets.contains(enemySpriteOrBullet)) {
          enemySpriteOrBullet.destroy();
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
