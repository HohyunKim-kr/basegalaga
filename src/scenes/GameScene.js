import Phaser from 'phaser';
import { STAGE_CONFIG, BOSS_CONFIG, calculateFinalScore } from '../utils/gameConfig.js';
import {
  PREMIUM_COLORS,
  PREMIUM_FONTS,
  createPremiumBackground,
  createGlassPanel,
  createPremiumTextStyle
} from '../utils/premiumStyle.js';
import { createUserHeader } from '../utils/userHeader.js';
import { createRexPanel, createRexLabel } from '../utils/rexUIHelper.js';
import { WEAPON_PATTERNS, WEAPON_UPGRADE_ORDER } from '../utils/weaponPatterns.js';
import { ITEM_TYPES, getRandomItem } from '../utils/items.js';
import { isMobile } from '../main.js';
import { TouchControlManager } from '../managers/TouchControlManager.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { FlockAPIService } from '../services/FlockAPIService.js';
import { FLOCK_CONFIG } from '../config/flockConfig.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    console.log('=== GameScene preload 시작 ===');

    // 배경 이미지 로드
    this.load.image('bg1', '/bg1.png');
    this.load.image('bg2', '/bg2.png');

    // 캐릭터 이미지 로드
    this.load.image('character', '/character.png');

    // 총알 이미지 로드
    this.load.image('bullet', '/bullet.png');

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

    // Shooting
    this.fireRate = 200; // ms between shots
    this.nextFire = 0;
    this.lastShotTime = 0;
    this.baseFireRate = 200;
    this.fireRateMultiplier = 1.0;

    // Weapon system
    this.weaponLevel = 0; // 0 = SINGLE, 1 = DOUBLE, 2 = TRIPLE, 3 = SPREAD, 4 = LASER
    this.weaponUpgradeOrder = WEAPON_UPGRADE_ORDER;

    // Active effects
    this.activeEffects = {
      shield: false,
      speedBoost: false,
      fireRateBoost: false,
      effectTimer: null
    };
    this.activeEffect = null;
    this.shieldVisual = null;
    this.effectIndicator = null;

    // Item selection system
    this.itemSelectionActive = false;
    this.itemSelectionUI = null;

    // Skill system
    this.skillCooldown = 0;
    this.skillCooldownMax = 10000; // 10 seconds
    this.skillActive = false;
    this.lastSkillPress = 0;

    // FLock API for AI item selection
    this.flockAPI = new FlockAPIService(FLOCK_CONFIG.API_KEY);
    this.useAISelection = FLOCK_CONFIG.ENABLED;

    // 선택한 아이템 추적 (게임 요약용)
    this.selectedItemsHistory = [];

    // 배경 이미지
    this.backgroundImage = null;
    this.backgroundGradients = null; // 기존 그라디언트 배경 저장용
  }

  create() {
    const { width, height } = this.cameras.main;

    // 1. Particle Systems
    this.createParticleSystems();

    // 이미지 로드 상태 확인 및 재로드
    const imageKeys = ['character', 'enemy1', 'enemy2', 'enemy3', 'enemy4', 'boss1', 'boss2'];
    const imagePaths = {
      'character': '/character.png',
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

    // 배경 이미지 설정 (Premium Background)
    createPremiumBackground(this, width, height);

    // Subtle grid overlay (Optional, maybe remove if it clashes with stars)
    // createModernGrid(this, width, height); 

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

    // Player with character image
    const playerX = width / 2;
    const playerY = height - 80;
    const playerSize = isMobile ? 60 : 70; // 캐릭터 크기 증가

    // 캐릭터 이미지가 로드되어 있는지 확인
    if (this.textures.exists('character')) {
      // 이미지로 플레이어 생성
      this.player = this.add.image(playerX, playerY, 'character');
      this.player.setDisplaySize(playerSize, playerSize);
      console.log('✓ 캐릭터 이미지로 플레이어 생성');
    } else {
      // 이미지가 없으면 기존 사각형으로 폴백
      console.warn('⚠️ 캐릭터 이미지가 로드되지 않음. 사각형으로 폴백.');
      this.player = this.add.rectangle(playerX, playerY, playerSize, playerSize, PREMIUM_COLORS.neonCyan);
    }

    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setImmovable(true);

    // Player 네온 글로우 효과 (캐릭터 크기에 맞게 조정)
    const glowSize = playerSize * 1.5;
    this.playerGlow = this.add.circle(this.player.x, this.player.y, glowSize, PREMIUM_COLORS.neonCyan, 0.2);
    this.playerGlow.setDepth(-1);

    // 글로우 애니메이션
    this.tweens.add({
      targets: this.playerGlow,
      alpha: { from: 0.2, to: 0.4 },
      scale: { from: 0.9, to: 1.1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Premium HUD Creation
    this.createPremiumHUD(width, height);

    // Touch controls (모바일 전용 - 키보드 컨트롤 제거)
    this.touchControlManager = new TouchControlManager(this);
    this.touchControlManager.createControls();

    // Get controls reference for easier access
    this.touchControls = this.touchControlManager.getControls();

    // 디버깅: 컨트롤이 제대로 생성되었는지 확인
    console.log('GameScene: TouchControlManager created', this.touchControlManager);
    console.log('GameScene: TouchControls', this.touchControls);

    // Keyboard controls (웹 환경용)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // WASD keys as alternative
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    console.log('GameScene: Keyboard controls initialized');

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

    // 플레이어 이동 - 터치 또는 키보드
    const moveSpeed = 5;

    // 키보드 입력 처리 (Arrow keys or WASD)
    let keyboardMoving = false;
    if (this.cursors || this.wKey) {
      if (this.cursors.left.isDown || this.aKey.isDown) {
        this.player.x -= moveSpeed;
        keyboardMoving = true;
      }
      if (this.cursors.right.isDown || this.dKey.isDown) {
        this.player.x += moveSpeed;
        keyboardMoving = true;
      }
      if (this.cursors.up.isDown || this.wKey.isDown) {
        this.player.y -= moveSpeed;
        keyboardMoving = true;
      }
      if (this.cursors.down.isDown || this.sKey.isDown) {
        this.player.y += moveSpeed;
        keyboardMoving = true;
      }
    }

    // 터치 위치로 직접 이동 (키보드 입력이 없을 때만)
    if (!keyboardMoving && this.touchControls.touchX !== null && this.touchControls.touchY !== null) {
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

    // Shooting (continuous fire) - 터치 또는 키보드
    const currentFireRate = this.baseFireRate / this.fireRateMultiplier;

    // 발사 조건: 터치 fire 버튼 또는 스페이스바
    const shouldFire = (this.touchControls && this.touchControls.shoot) ||
      (this.spaceKey && this.spaceKey.isDown);

    if (shouldFire && time - this.lastShotTime > currentFireRate) {
      this.shoot();
      this.lastShotTime = time;
    }

    // 스킬 발동 (Shift 키 또는 터치)
    if (this.shiftKey && Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      this.activateSkill();
    } else if (this.touchControls && this.touchControls.skill && time > this.lastSkillPress + 500) {
      this.activateSkill();
      this.lastSkillPress = time;
    }
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

    this.stageText.setText(`STAGE ${this.currentStage}`);

    // 배경 업데이트 (스테이지에 따라)
    const { width, height } = this.cameras.main;
    this.updateBackground(width, height);

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
    // Enemy 클래스의 startDive 메서드 사용
    if (enemy && typeof enemy.startDive === 'function') {
      enemy.startDive();
    }
  }

  returnToFormation(enemy) {
    // Enemy 클래스의 returnToFormation 메서드 사용
    if (enemy && typeof enemy.returnToFormation === 'function') {
      enemy.returnToFormation();
    }
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
      if (this.boss && this.boss.healthBar) {
        this.bossHealthBar = this.boss.healthBar;
      }
    }
  }

  shoot() {
    if (!this.player || !this.bullets) return;

    // Get current weapon pattern based on weaponLevel
    const weaponPatterns = [
      WEAPON_PATTERNS.SINGLE,
      WEAPON_PATTERNS.DOUBLE,
      WEAPON_PATTERNS.TRIPLE,
      WEAPON_PATTERNS.SPREAD,
      WEAPON_PATTERNS.LASER
    ];

    const currentWeapon = weaponPatterns[this.weaponLevel] || WEAPON_PATTERNS.SINGLE;
    const bulletCount = currentWeapon.bullets;
    const spread = currentWeapon.spread || 0;
    const speed = currentWeapon.speed || 400;
    const bulletSize = currentWeapon.size || { width: 5, height: 15 };

    // Generate bullet offsets based on weapon pattern
    const bulletOffsets = [];
    if (bulletCount === 1) {
      // Single bullet straight up
      bulletOffsets.push({ x: 0, y: 0, vx: 0, vy: -speed });
    } else {
      // Multiple bullets with spread
      const totalSpread = spread * (bulletCount - 1);
      const startAngle = -totalSpread / 2;
      
      for (let i = 0; i < bulletCount; i++) {
        const angle = startAngle + (totalSpread / (bulletCount - 1)) * i;
        const offsetX = Math.sin(angle) * 20; // Horizontal offset
        bulletOffsets.push({
          x: offsetX,
          y: 0,
          vx: Math.sin(angle) * speed * 0.3, // Slight horizontal velocity
          vy: -speed
        });
      }
    }

    // Create bullets based on offsets
    bulletOffsets.forEach(offset => {
      const bullet = this.add.image(
        this.player.x + offset.x,
        this.player.y + offset.y,
        'bullet'
      );
      // 총알 크기 조정
      bullet.setDisplaySize(bulletSize.width, bulletSize.height);
      // 무기 색상으로 tint 적용
      bullet.setTint(currentWeapon.color);
      this.physics.add.existing(bullet);
      this.bullets.add(bullet);
      bullet.body.setVelocity(offset.vx || 0, offset.vy || -speed);
    });
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
      const bullet = this.add.image(enemy.x, enemy.y + 20, 'bullet');
      bullet.setDisplaySize(5, 15);
      bullet.setTint(bulletColor);
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
          const bullet = this.add.image(enemy.x, enemy.y + 20, 'bullet');
          bullet.setDisplaySize(5, 15);
          bullet.setTint(bulletColor);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const spread = (i - 1) * 0.3;
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + spread;
          bullet.body.setVelocityX(Math.cos(angle) * 100);
          bullet.body.setVelocityY(Math.sin(angle) * 100 + config.enemySpeed * 0.3);
        }
      } else {
        // Aimed shot
        const bullet = this.add.image(enemy.x, enemy.y + 20, 'bullet');
        bullet.setDisplaySize(5, 15);
        bullet.setTint(bulletColor);
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
          const bullet = this.add.image(enemy.x, enemy.y + 20, 'bullet');
          bullet.setDisplaySize(5, 15);
          bullet.setTint(bulletColor);
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
          const bullet = this.add.image(enemy.x + (i - 0.5) * 15, enemy.y + 20, 'bullet');
          bullet.setDisplaySize(5, 15);
          bullet.setTint(bulletColor);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
          bullet.body.setVelocityX(Math.cos(angle) * 120);
          bullet.body.setVelocityY(Math.sin(angle) * 120 + config.enemySpeed * 0.4);
        }
      } else {
        // Aimed shot with prediction
        const bullet = this.add.image(enemy.x, enemy.y + 20, 'bullet');
        bullet.setDisplaySize(5, 15);
        bullet.setTint(bulletColor);
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
        const bullet = this.add.image(this.boss.x, this.boss.y + 40, 'bullet');
        bullet.setDisplaySize(8, 20);
        bullet.setTint(bossConfig.color);
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
          const bullet = this.add.image(this.boss.x, this.boss.y + 40, 'bullet');
          bullet.setDisplaySize(8, 20);
          bullet.setTint(bossConfig.color);
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
          const bullet = this.add.image(this.boss.x, this.boss.y + 40, 'bullet');
          bullet.setDisplaySize(8, 20);
          bullet.setTint(bossConfig.color);
          this.physics.add.existing(bullet);
          this.enemyBullets.add(bullet);
          const angle = (Math.PI * 2 / 8) * i;
          bullet.body.setVelocityX(Math.cos(angle) * 150);
          bullet.body.setVelocityY(Math.sin(angle) * 150);
        }
      } else {
        // Targeted burst
        for (let i = 0; i < 4; i++) {
          const bullet = this.add.image(this.boss.x, this.boss.y + 40, 'bullet');
          bullet.setDisplaySize(8, 20);
          bullet.setTint(bossConfig.color);
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
      this.scoreText.setText(`SCORE: ${this.score}`);

      // Restore full health when boss is defeated
      this.playerHealth = this.maxHealth;
      this.healthText.setText(`HP: ${this.playerHealth}/${this.maxHealth}`);

      // Show health restored message - Modern style
      const { width, height } = this.cameras.main;
      const restoreText = createRexLabel(this, width / 2, height / 2, 'HEALTH RESTORED', {
        fontSize: isMobile ? 32 : 40,
        color: '#ffffff',
        backgroundColor: null
      });

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

  // 이전 UI 완전히 정리 (잔상 방지)
  this.cleanupItemSelectionUI();

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

  // Selection panel - Rex UI
  const panelWidth = isMobile ? width * 0.99 : width * 0.9;
  const panelHeight = isMobile ? height * 0.80 : height * 0.6;
  const panel = createRexPanel(this, width / 2, height / 2, panelWidth, panelHeight, {
    backgroundColor: 0x0a0a0a,
    borderColor: PREMIUM_COLORS.neonCyan,
    borderWidth: 3,
    alpha: 0.95,
    cornerRadius: 10
  });
  panel.setDepth(1001);

  // Title - Rex UI
  const titleY = isMobile ? height * 0.22 : height * 0.25;
  const title = createRexLabel(this, width / 2, titleY, 'SELECT ITEM', {
    fontSize: isMobile ? 24 : 40,
    color: '#ffffff',
    backgroundColor: null
  });
  title.setDepth(1002);

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

    // 아이템 카드 텍스트 - Rex UI
    const numText = createRexLabel(this, x, y - cardHeight * 0.38, `${index + 1}`, {
      fontSize: isMobile ? 16 : 26,
      color: '#ffffff',
      backgroundColor: null
    });
    numText.setDepth(1003);

    const nameText = createRexLabel(this, x, y + cardHeight * 0.12, itemType.name, {
      fontSize: isMobile ? 10 : 18,
      color: `#${itemType.color.toString(16).padStart(6, '0')}`,
      backgroundColor: null
    });
    nameText.setDepth(1003);
    if (nameText.childrenMap && nameText.childrenMap.text) {
      nameText.childrenMap.text.setWordWrapWidth(cardWidth * 0.85);
    }

    const description = itemType.description || 'UPGRADE';
    const descText = createRexLabel(this, x, y + cardHeight * 0.32, description, {
      fontSize: isMobile ? 8 : 12,
      color: '#ffffff',
      backgroundColor: null
    });
    descText.setDepth(1003);
    if (descText.childrenMap && descText.childrenMap.text) {
      descText.childrenMap.text.setAlign('center');
      descText.childrenMap.text.setWordWrapWidth(cardWidth * 0.8);
    }

    itemButtons.push({ card, icon, nameText, descText, numText, itemType });
  });

  // Instructions - Rex UI
  const instructionY = isMobile ? height * 0.88 : height * 0.75;
  const instructionText = createRexLabel(this, width / 2, instructionY, this.useAISelection ? 'AI is selecting...' : 'Tap to select', {
    fontSize: isMobile ? 12 : 16,
    color: '#ffffff',
    backgroundColor: null
  });
  instructionText.setDepth(1003);

  // AI 선택 모드에서는 수동 선택 비활성화
  let onItemTouch = null;
  if (!this.useAISelection) {
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

    onItemTouch = (event) => {
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
  }

  this.itemSelectionUI = {
    overlay,
    panel,
    title,
    instructionText,
    itemButtons,
    selectedItems,
    onItemTouch, // AI 모드일 때는 null
    cardAreas
  };

  // AI 자동 선택 활성화 시
  if (this.useAISelection) {
    // 랜덤 선택 모드: 게임 상태와 무관하게 완전 랜덤 선택
    const useRandomSelection = true;
    this.selectItemWithAI(selectedItems, instructionText, useRandomSelection);
  }
}

  /**
   * Generate game summary and show Star Wars crawl
   */
  async generateAndShowSummary(gameStats) {
  try {
    console.log('🎬 Generating game summary...', gameStats);

    // FLock API로 요약 생성
    const summaryText = await this.flockAPI.generateGameSummary(gameStats);

    console.log('📝 Generated summary:', summaryText);

    if (!summaryText || summaryText.trim() === '') {
      throw new Error('Empty summary text');
    }

    // Star Wars 크롤 씬으로 전환
    this.time.delayedCall(500, () => {
      console.log('🎬 Starting GameSummaryScene with summary:', summaryText.substring(0, 50) + '...');
      this.scene.start('GameSummaryScene', {
        summaryText: summaryText,
        gameStats: gameStats
      });
    });
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    // 에러 발생 시 바로 GameOver로 (폴백 요약 사용)
    const fallbackSummary = this.flockAPI.generateFallbackSummary(gameStats);
    console.log('📝 Using fallback summary:', fallbackSummary);

    const finalScore = calculateFinalScore(gameStats.score || 0, gameStats.currentStage || 1, gameStats.elapsedTime || 0);
    this.time.delayedCall(500, () => {
      // 폴백 요약으로도 크롤 표시 시도
      try {
        this.scene.start('GameSummaryScene', {
          summaryText: fallbackSummary,
          gameStats: gameStats
        });
      } catch (sceneError) {
        console.error('Scene start error, going to GameOver:', sceneError);
        this.scene.start('GameOver', {
          score: finalScore,
          baseScore: gameStats.baseScore || gameStats.score || 0,
          time: gameStats.elapsedTime || 0,
          stage: gameStats.currentStage || 1,
          allCleared: gameStats.allCleared || false
        });
      }
    });
  }
}

/**
 * Clean up item selection UI completely
 */
  cleanupItemSelectionUI() {
  if (!this.itemSelectionUI) return;

  // 모든 트윈 정리
  if (this.itemSelectionUI.itemButtons && Array.isArray(this.itemSelectionUI.itemButtons)) {
    this.itemSelectionUI.itemButtons.forEach(btn => {
      if (btn.card) this.tweens.killTweensOf(btn.card);
      if (btn.icon) this.tweens.killTweensOf(btn.icon);
      if (btn.selectedIcon) this.tweens.killTweensOf(btn.selectedIcon);
    });
  }

  // DOM 이벤트 리스너 제거
  const canvas = this.game.canvas;
  if (this.itemSelectionUI.onItemTouch) {
    const onItemTouch = this.itemSelectionUI.onItemTouch;
    canvas.removeEventListener('touchstart', onItemTouch, { capture: true });
    canvas.removeEventListener('mousedown', onItemTouch, { capture: true });
    if (typeof document !== 'undefined') {
      document.removeEventListener('touchstart', onItemTouch, { capture: true });
      document.removeEventListener('mousedown', onItemTouch, { capture: true });
    }
  }

  // 모든 UI 요소 제거
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
        if (btn.selectedIcon && btn.selectedIcon.active) btn.selectedIcon.destroy();
      });
    }
  } catch (error) {
    console.warn('Cleanup error:', error);
  }

  this.itemSelectionUI = null;
}

  /**
   * Use FLock API to automatically select the best item
   */
  async selectItemWithAI(selectedItems, instructionText, useRandom = false) {
  try {
    // 랜덤 선택 모드인 경우 게임 상태 수집 생략
    let gameState = null;
    if (!useRandom) {
      gameState = {
        currentStage: this.currentStage,
        playerHealth: this.playerHealth,
        maxHealth: this.maxHealth,
        score: this.score,
        weaponLevel: this.weaponLevel,
        fireRate: this.fireRate,
        activeEffects: {
          shield: this.activeEffects.shield,
          scoreMultiplier: this.activeEffects.scoreMultiplier
        }
      };
    }

    // 선택 중 메시지 표시
    if (instructionText && instructionText.active) {
      instructionText.setText(useRandom ? '🎲 Random selecting...' : 'AI is analyzing...');
    }

    // API 호출 시작 시간 측정
    const selectionStartTime = performance.now();

    // 랜덤 선택 또는 AI 선택
    const selectedIndex = await this.flockAPI.selectItem(gameState, selectedItems, useRandom);

    const selectionEndTime = performance.now();
    const selectionTime = (selectionEndTime - selectionStartTime).toFixed(2);
    console.log(`⏱️ Total selection time: ${selectionTime}ms`);

    const selectedItem = selectedItems[selectedIndex];
    console.log('✓ Selected:', selectedItem?.name, '(index:', selectedIndex + ')', useRandom ? '(RANDOM)' : '(AI)');

    // 선택된 아이템 하이라이트
    if (selectedIndex >= 0 && selectedIndex < selectedItems.length) {
      const selectedItem = selectedItems[selectedIndex];

      // 선택된 카드 하이라이트 애니메이션
      if (this.itemSelectionUI && this.itemSelectionUI.itemButtons && this.itemSelectionUI.itemButtons[selectedIndex]) {
        const btn = this.itemSelectionUI.itemButtons[selectedIndex];

        // 선택된 카드 강조 표시 (더 명확하게)
        btn.card.setStrokeStyle(5, 0xffffff, 1);
        btn.card.setFillStyle(selectedItem.color, 0.6);

        // 선택 표시 아이콘 추가
        if (!btn.selectedIcon) {
          btn.selectedIcon = this.add.text(btn.card.x, btn.card.y - btn.card.height / 2 + 10, '✓', {
            fontSize: isMobile ? '20px' : '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5).setDepth(1004);
        }

        // 랜덤 선택 시 몸 사이즈 1.3배 커지는 애니메이션
        if (useRandom) {
          // 모든 카드에 랜덤 선택 애니메이션 적용
          this.itemSelectionUI.itemButtons.forEach((button, idx) => {
            if (button.card && button.card.active) {
              // 원래 크기 저장
              if (!button.originalScale) {
                button.originalScale = { x: button.card.scaleX, y: button.card.scaleY };
              }

              // 랜덤하게 1.3배 커지는 애니메이션
              this.tweens.add({
                targets: [button.card, button.icon],
                scaleX: button.originalScale.x * 1.3,
                scaleY: button.originalScale.y * 1.3,
                duration: 300,
                ease: 'Back.easeOut',
                onComplete: () => {
                  // 선택된 카드만 유지, 나머지는 원래 크기로
                  if (idx !== selectedIndex) {
                    this.tweens.add({
                      targets: [button.card, button.icon],
                      scaleX: button.originalScale.x,
                      scaleY: button.originalScale.y,
                      duration: 200
                    });
                  }
                }
              });
            }
          });
        }

        this.tweens.add({
          targets: [btn.card, btn.icon, btn.selectedIcon],
          scale: { from: 1, to: 1.2 },
          alpha: { from: 1, to: 1 },
          duration: 400,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            // instructionText가 아직 존재하는지 확인
            if (this.itemSelectionUI && this.itemSelectionUI.instructionText && this.itemSelectionUI.instructionText.active) {
              try {
                const selectionText = useRandom ? '🎲 RANDOM SELECTED' : '✓ AI SELECTED';
                this.itemSelectionUI.instructionText.setText(`${selectionText}: ${selectedItem.name}`);
                // Rex UI Label의 setColor는 childrenMap.text를 통해 접근
                if (this.itemSelectionUI.instructionText.childrenMap && this.itemSelectionUI.instructionText.childrenMap.text) {
                  this.itemSelectionUI.instructionText.childrenMap.text.setColor(`#${selectedItem.color.toString(16).padStart(6, '0')}`);
                  const fontSize = this.scale.width < 768 ? 14 : 18;
                  this.itemSelectionUI.instructionText.childrenMap.text.setFontSize(fontSize);
                }
              } catch (error) {
                console.warn('Error updating instruction text:', error);
              }
            }
            // 0.5초 후 자동 선택 (대기 시간 단축)
            this.time.delayedCall(500, () => {
              console.log('✓ Applying selected item:', selectedItem.name);
              this.selectItem(selectedItem);
            });
          }
        });
      } else {
        // UI가 없으면 바로 선택
        console.log('UI not available, selecting immediately:', selectedItem.name);
        this.time.delayedCall(500, () => {
          this.selectItem(selectedItem);
        });
      }
    } else {
      // 폴백: 첫 번째 아이템 선택
      if (this.itemSelectionUI && this.itemSelectionUI.instructionText && this.itemSelectionUI.instructionText.active) {
        try {
          this.itemSelectionUI.instructionText.setText('AI selection failed, using fallback');
        } catch (error) {
          console.warn('Error updating instruction text:', error);
        }
      }
      this.time.delayedCall(1000, () => {
        this.selectItem(selectedItems[0]);
      });
    }
  } catch (error) {
    console.error('AI selection error:', error);
    if (this.itemSelectionUI && this.itemSelectionUI.instructionText && this.itemSelectionUI.instructionText.active) {
      try {
        this.itemSelectionUI.instructionText.setText('AI error, using fallback');
      } catch (error) {
        console.warn('Error updating instruction text:', error);
      }
    }
    // 에러 발생 시 폴백 선택
    this.time.delayedCall(1000, () => {
      this.selectItem(selectedItems[0]);
    });
  }
}

  selectItem(itemType) {
  if (!this.itemSelectionActive) return;

  // 선택한 아이템 기록 (게임 요약용)
  if (itemType && itemType.name) {
    this.selectedItemsHistory.push({
      name: itemType.name,
      stage: this.currentStage,
      timestamp: Date.now()
    });
    console.log('📝 Item selected:', itemType.name, 'at stage', this.currentStage);
  }

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
          // 모든 버튼 요소 제거
          if (btn.card && btn.card.active) {
            // 트윈 정리
            if (btn.card.tweenData) {
              this.tweens.killTweensOf(btn.card);
            }
            btn.card.destroy();
          }
          if (btn.icon && btn.icon.active) {
            if (btn.icon.tweenData) {
              this.tweens.killTweensOf(btn.icon);
            }
            btn.icon.destroy();
          }
          if (btn.nameText && btn.nameText.active) btn.nameText.destroy();
          if (btn.descText && btn.descText.active) btn.descText.destroy();
          if (btn.numText && btn.numText.active) btn.numText.destroy();
          // 선택 표시 아이콘 제거 (잔상 방지)
          if (btn.selectedIcon && btn.selectedIcon.active) {
            if (btn.selectedIcon.tweenData) {
              this.tweens.killTweensOf(btn.selectedIcon);
            }
            btn.selectedIcon.destroy();
          }
          // 원래 크기 정보도 초기화
          btn.originalScale = null;
          btn.selectedIcon = null;
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
  const effectText = createRexLabel(this, width / 2, height / 2, `${itemType.name} SELECTED`, {
    fontSize: isMobile ? 28 : 36,
    color: `#${itemType.color.toString(16).padStart(6, '0')}`,
    backgroundColor: null
  });
  effectText.setDepth(1000);

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
    // weaponLevel을 사용하여 현재 무기 가져오기
    const weaponPatterns = [
      WEAPON_PATTERNS.SINGLE,
      WEAPON_PATTERNS.DOUBLE,
      WEAPON_PATTERNS.TRIPLE,
      WEAPON_PATTERNS.SPREAD,
      WEAPON_PATTERNS.LASER
    ];
    const currentWeapon = weaponPatterns[this.weaponLevel] || WEAPON_PATTERNS.SINGLE;
    this.updateWeaponDisplay();
    // Rex UI Label의 setColor는 childrenMap.text를 통해 접근
    if (this.weaponText && this.weaponText.childrenMap && this.weaponText.childrenMap.text) {
      this.weaponText.childrenMap.text.setColor(`#${currentWeapon.color.toString(16).padStart(6, '0')}`);
    }
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
    const currentIndex = this.weaponLevel || 0;
    if (currentIndex < WEAPON_UPGRADE_ORDER.length - 1) {
      const nextWeaponName = WEAPON_UPGRADE_ORDER[currentIndex + 1];
      this.weaponLevel = currentIndex + 1;
      const currentWeapon = WEAPON_PATTERNS[nextWeaponName];

      if (this.weaponText) {
        this.weaponText.setText(`WEAPON: ${currentWeapon.name}`);
        // Rex UI Label의 setColor는 childrenMap.text를 통해 접근
        if (this.weaponText.childrenMap && this.weaponText.childrenMap.text) {
          this.weaponText.childrenMap.text.setColor(`#${currentWeapon.color.toString(16).padStart(6, '0')}`);
        }
      }

      this.showItemMessage('WEAPON PERMANENTLY UPGRADED!', currentWeapon.color);
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
  const message = createRexLabel(this, width / 2, height * 0.3, text, {
    fontSize: isMobile ? 24 : 28,
    color: `#${color.toString(16).padStart(6, '0')}`,
    backgroundColor: null
  });

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

    // 게임 통계 수집 및 요약 생성
    this.generateAndShowSummary({
      score: finalScore,
      baseScore: this.score,
      elapsedTime: this.elapsedTime,
      currentStage: this.currentStage,
      enemiesKilled: this.enemiesKilled,
      selectedItemsHistory: this.selectedItemsHistory,
      allCleared: false
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
    const clearText = createRexLabel(this, width / 2, height / 2, `STAGE ${this.currentStage} CLEAR`, {
      fontSize: isMobile ? 40 : 56,
      color: '#ffffff',
      backgroundColor: null
    });

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
    // 게임 통계 수집 및 요약 생성
    this.generateAndShowSummary({
      score: finalScore,
      baseScore: this.score,
      elapsedTime: this.elapsedTime,
      currentStage: this.currentStage,
      enemiesKilled: this.enemiesKilled,
      selectedItemsHistory: this.selectedItemsHistory,
      allCleared: true
    });
  }
}

  updateBackground(width, height) {
    // Deprecated - replaced by createPremiumBackground
  }

  createUIPanel(width, height) {
    // Deprecated - replaced by createPremiumHUD
  }

  activateSkill() {
  if (this.skillActive || this.skillCooldown > 0) return;

  this.skillActive = true;
  this.skillCooldown = this.skillCooldownMax;

  // Skill effect: Rapid fire burst + screen clear
  const { width, height } = this.cameras.main;

  // Visual effect
  const skillEffect = this.add.rectangle(width / 2, height / 2, width, height, PREMIUM_COLORS.neonMagenta, 0.25);
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

  createPremiumHUD(width, height) {
  const padding = 20;
  const topBarHeight = 60;

  // 1. Top Glass Panel (Score & Time)
  createGlassPanel(this, width / 2, topBarHeight / 2 + 10, width - padding * 2, topBarHeight);

  // Score (Left)
  this.scoreText = this.add.text(padding * 2, 25, 'SCORE: 0', {
    fontFamily: PREMIUM_FONTS.header,
    fontSize: '20px',
    color: '#ffffff',
    shadow: { blur: 5, color: PREMIUM_COLORS.neonGold, fill: true }
  }).setOrigin(0, 0.5).setScrollFactor(0);

  // Time (Center)
  this.timeText = this.add.text(width / 2, 25, '00:00', {
    fontFamily: PREMIUM_FONTS.body,
    fontSize: '24px',
    color: '#ffffff'
  }).setOrigin(0.5, 0.5).setScrollFactor(0);

  // Stage (Right)
  this.stageText = this.add.text(width - padding * 2, 25, 'STAGE 1', {
    fontFamily: PREMIUM_FONTS.header,
    fontSize: '20px',
    color: '#00f260',
    shadow: { blur: 5, color: '#00f260', fill: true }
  }).setOrigin(1, 0.5).setScrollFactor(0);

  // 2. Bottom Status (Health & Weapon)
  // Health Bar (Bottom Left)
  this.healthText = this.add.text(padding, height - 30, `HP: ${this.playerHealth}`, {
    fontFamily: PREMIUM_FONTS.header,
    fontSize: '18px',
    color: PREMIUM_COLORS.neonRed
  }).setOrigin(0, 0.5).setScrollFactor(0);

  // Weapon Info (Top Right)
  const weaponNames = ['SINGLE', 'DOUBLE', 'TRIPLE', 'SPREAD', 'LASER'];
  const weaponName = weaponNames[this.weaponLevel] || 'SINGLE';

  this.weaponText = this.add.text(width - padding, padding + 10, `WEAPON: ${weaponName}`, {
    fontFamily: PREMIUM_FONTS.header,
    fontSize: '18px',
    color: PREMIUM_COLORS.neonCyan
  }).setOrigin(1, 0.5).setScrollFactor(0);
}

  updateWeaponDisplay() {
  if (this.weaponText) {
    const weaponNames = ['SINGLE', 'DOUBLE', 'TRIPLE', 'SPREAD', 'LASER'];
    const weaponName = weaponNames[this.weaponLevel] || 'SINGLE';
    this.weaponText.setText(`WEAPON: ${weaponName}`);
  }
}

  updateBackground(width, height) {
    // Managed by createPremiumBackground now
  }

  createUIPanel(width, height) {
    // Deprecated
  }

  createParticleSystems() {
  // Explosion Particles
  this.explosionParticles = this.add.particles(0, 0, 'white_pixel', {
    speed: { min: 50, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    blendMode: 'ADD',
    lifespan: 600,
    gravityY: 0,
    quantity: 20,
    on: false
  });

  // Create a white pixel texture if it doesn't exist
  if (!this.textures.exists('white_pixel')) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 4, 4);
    graphics.generateTexture('white_pixel', 4, 4);
  }
}

  createExplosion(x, y, color = 0xffaa00) {
  // Screen Shake
  this.cameras.main.shake(100, 0.01);

  // Particle Burst
  this.explosionParticles.setPosition(x, y);
  this.explosionParticles.particleTint = color;
  this.explosionParticles.emitParticle(20);

  // Flash Effect
  const flash = this.add.circle(x, y, 50, color, 1);
  this.tweens.add({
    targets: flash,
    scale: 2,
    alpha: 0,
    duration: 200,
    onComplete: () => flash.destroy()
  });
}

// Override hitEnemy to add effects
  hitEnemy(bullet, enemySprite) {
  if (!bullet.active || !enemySprite.active) return;

  const enemy = enemySprite.enemyInstance;
  if (!enemy) {
    bullet.destroy();
    enemySprite.destroy();
    return;
  }

  // Visual Feedback
  this.createExplosion(bullet.x, bullet.y, 0xff0055); // Red/Pink hit effect

  // Call original logic (simplified here as we can't easily call super or original method without refactoring)
  // We'll reimplement the core hit logic with effects

  bullet.destroy();
  // 기본 데미지는 1 (WEAPON_PATTERNS에는 damage 속성이 없음)
  enemy.takeDamage(1);

  // Flash enemy white
  enemySprite.setTint(0xffffff);
  this.time.delayedCall(50, () => {
    if (enemySprite.active) enemySprite.clearTint();
  });

  if (enemy.health <= 0) {
    this.createExplosion(enemy.x, enemy.y, 0xffaa00); // Orange explosion on death

    // Score logic
    const basePoints = enemy.points;
    const finalPoints = Math.floor(basePoints * this.activeEffects.scoreMultiplier);
    this.score += finalPoints;
    this.enemiesKilled++;
    this.scoreText.setText(`SCORE: ${this.score}`);

    // Floating Text
    this.showFloatingText(enemy.x, enemy.y, `+${finalPoints}`);

    enemy.destroy();

    // Item drop chance
    if (Math.random() < 0.15) { // 15% drop rate
      this.spawnItem(enemy.x, enemy.y);
    }
  }
}

  showFloatingText(x, y, text) {
  const label = this.add.text(x, y, text, {
    fontFamily: PREMIUM_FONTS.body,
    fontSize: '16px',
    color: '#ffd700',
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(0.5);

  this.tweens.add({
    targets: label,
    y: y - 50,
    alpha: 0,
    duration: 800,
    onComplete: () => label.destroy()
  });
}

  shutdown() {
    // TouchControlManager 완전히 정리
    if (this.touchControlManager) {
      try {
        this.touchControlManager.destroy();
        this.touchControlManager = null;
        console.log('GameScene: TouchControlManager destroyed');
      } catch (error) {
        console.warn('TouchControlManager cleanup error:', error);
      }
    }

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