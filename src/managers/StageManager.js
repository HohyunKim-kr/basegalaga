import { STAGE_CONFIG, BOSS_CONFIG } from '../utils/gameConfig.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';

export class StageManager {
  constructor(scene) {
    this.scene = scene;
    this.currentStage = 1;
    this.enemiesKilled = 0;
    this.enemiesToKill = 0;
    this.stageCleared = false;
    this.enemyFormation = [];
    this.enemies = null;
    this.boss = null;
  }
  
  setEnemyGroup(group) {
    this.enemies = group;
  }
  
  startStage() {
    this.stageCleared = false;
    this.enemiesKilled = 0;
    const config = STAGE_CONFIG[this.currentStage];
    this.enemiesToKill = config.enemyCount;
    if (config.hasBoss) {
      this.enemiesToKill += 1;
    }
    
    this.spawnEnemyFormation();
    
    if (config.hasBoss) {
      this.scene.time.delayedCall(3000, () => {
        this.spawnBoss();
      });
    }
  }
  
  spawnEnemyFormation() {
    const config = STAGE_CONFIG[this.currentStage];
    const { width, height } = this.scene.cameras.main;
    
    this.enemyFormation = [];
    
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
        
        const enemy = new Enemy(this.scene, x, y, {
          enemyColor: config.enemyColor,
          enemyImage: config.enemyImage,  // 이미지 키 추가
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
  }
  
  spawnBoss() {
    if (this.boss && this.boss.active) return;
    
    const bossConfig = BOSS_CONFIG[this.currentStage];
    if (!bossConfig) return;
    
    const { width } = this.scene.cameras.main;
    this.boss = new Boss(this.scene, width / 2, 100, bossConfig);
  }
  
  updateEnemies(currentTime, playerX, playerY, enemyBulletGroup, stageConfig) {
    this.enemyFormation.forEach((enemy, index) => {
      if (!enemy || !enemy.active) return;
      
      // Check dive
      if (enemy.shouldDive(currentTime)) {
        enemy.startDive();
      }
    });
  }
  
  updateBoss(currentTime) {
    if (this.boss && this.boss.active) {
      this.boss.updatePattern(currentTime);
    }
  }
  
  checkStageClear() {
    if (this.stageCleared) return false;
    
    if (this.enemies && this.enemies.countActive(true) === 0) {
      if (!this.boss || !this.boss.active) {
        this.stageCleared = true;
        return true;
      }
    }
    return false;
  }
  
  nextStage() {
    this.currentStage++;
  }
  
  getCurrentStage() {
    return this.currentStage;
  }
  
  getStageConfig() {
    return STAGE_CONFIG[this.currentStage];
  }
  
  getBossConfig() {
    return BOSS_CONFIG[this.currentStage];
  }
  
  incrementKills() {
    this.enemiesKilled++;
  }
  
  clear() {
    if (this.enemyFormation) {
      this.enemyFormation.forEach(enemy => {
        if (enemy) enemy.destroy();
      });
      this.enemyFormation = [];
    }
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
  }
}

