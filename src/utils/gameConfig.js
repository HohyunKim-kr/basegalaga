/**
 * Game configuration for stages, enemies, and bosses
 */

// Enemy image mapping - 스테이지별로 다른 이미지 사용
// 이미지 파일은 public/enemies/ 폴더에 넣어주세요
export const ENEMY_IMAGES = {
  1: 'enemy1',  // enemy1.png
  2: 'enemy1',  // enemy1.png
  3: 'enemy2',  // enemy2.png
  4: 'enemy2',  // enemy2.png
  5: 'enemy3',  // enemy3.png
  6: 'enemy3',  // enemy3.png
  7: 'enemy4',  // enemy4.png
  8: 'enemy4',  // enemy4.png
  9: 'enemy4',  // enemy4.png
  10: 'enemy4'  // enemy4.png
};

// Stage configurations - Progressive difficulty (easy at start, harder later)
export const STAGE_CONFIG = {
  1: {
    enemyColor: 0xff0000,      // Red
    enemyImage: 'enemy1',      // 이미지 키 추가
    enemyDamage: 1,
    enemyHealth: 1,
    enemyCount: 6,             // Reduced for easier start
    enemySpeed: 40,            // Slower
    enemyShootRate: 0.0005,   // Much lower shoot rate
    enemyPoints: 10,
    formation: 'grid'
  },
  2: {
    enemyColor: 0xff8800,      // Orange
    enemyImage: 'enemy1',      // 이미지 키 추가
    enemyDamage: 1,
    enemyHealth: 1,
    enemyCount: 8,             // Gradually increase
    enemySpeed: 50,
    enemyShootRate: 0.0008,
    enemyPoints: 15,
    formation: 'grid'
  },
  3: {
    enemyColor: 0xffff00,      // Yellow
    enemyImage: 'enemy2',      // 이미지 키 추가
    enemyDamage: 1,            // Still low damage
    enemyHealth: 1,
    enemyCount: 10,
    enemySpeed: 60,
    enemyShootRate: 0.0012,
    enemyPoints: 20,
    formation: 'grid'
  },
  4: {
    enemyColor: 0x00ff00,      // Green
    enemyImage: 'enemy2',      // 이미지 키 추가
    enemyDamage: 2,            // Start increasing damage
    enemyHealth: 1,            // Still 1 health
    enemyCount: 12,
    enemySpeed: 70,
    enemyShootRate: 0.0018,
    enemyPoints: 25,
    formation: 'grid'
  },
  5: {
    enemyColor: 0x0088ff,      // Blue
    enemyImage: 'enemy3',      // 이미지 키 추가
    enemyDamage: 2,
    enemyHealth: 2,            // Health increases
    enemyCount: 14,
    enemySpeed: 85,
    enemyShootRate: 0.0025,    // Moderate difficulty
    enemyPoints: 30,
    formation: 'grid',
    hasBoss: true
  },
  6: {
    enemyColor: 0x8800ff,      // Purple
    enemyImage: 'enemy3',      // 이미지 키 추가
    enemyDamage: 3,            // Damage increases
    enemyHealth: 2,
    enemyCount: 16,
    enemySpeed: 100,
    enemyShootRate: 0.003,
    enemyPoints: 40,
    formation: 'grid'
  },
  7: {
    enemyColor: 0xff00ff,      // Magenta
    enemyImage: 'enemy4',      // 이미지 키 추가
    enemyDamage: 3,
    enemyHealth: 3,            // Health increases
    enemyCount: 18,
    enemySpeed: 115,
    enemyShootRate: 0.0038,
    enemyPoints: 50,
    formation: 'grid'
  },
  8: {
    enemyColor: 0x00ffff,      // Cyan
    enemyImage: 'enemy4',      // 이미지 키 추가
    enemyDamage: 3,
    enemyHealth: 3,
    enemyCount: 20,
    enemySpeed: 130,
    enemyShootRate: 0.0045,
    enemyPoints: 60,
    formation: 'grid'
  },
  9: {
    enemyColor: 0xffffff,      // White
    enemyImage: 'enemy4',      // 이미지 키 추가
    enemyDamage: 4,            // High damage
    enemyHealth: 4,            // High health
    enemyCount: 22,
    enemySpeed: 145,
    enemyShootRate: 0.0055,
    enemyPoints: 75,
    formation: 'grid'
  },
  10: {
    enemyColor: 0xff0088,      // Pink
    enemyImage: 'enemy4',      // 이미지 키 추가
    enemyDamage: 5,            // Maximum damage
    enemyHealth: 4,
    enemyCount: 24,
    enemySpeed: 160,           // Maximum speed
    enemyShootRate: 0.0065,   // Maximum shoot rate
    enemyPoints: 100,
    formation: 'grid',
    hasBoss: true
  }
};

// Boss configurations
export const BOSS_CONFIG = {
  5: {
    color: 0x00ffff,           // Cyan boss
    bossImage: 'boss1',         // 이미지 키 추가
    health: 30,                // Reduced from 50 to 30
    damage: 3,
    size: 80,
    speed: 80,
    shootRate: 0.01,
    points: 500,
    pattern: 'zigzag'
  },
  10: {
    color: 0xff00ff,          // Magenta boss
    bossImage: 'boss2',        // 이미지 키 추가
    health: 100,
    damage: 5,
    size: 100,
    speed: 100,
    shootRate: 0.015,
    points: 1000,
    pattern: 'spiral'
  }
};

// Calculate final score with time bonus
export function calculateFinalScore(baseScore, timeElapsed, stage) {
  // Time bonus: faster = more points
  // Formula: baseScore + (maxTime - elapsedTime) * stageMultiplier
  const maxTime = 600000; // 10 minutes max
  const timeBonus = Math.max(0, (maxTime - timeElapsed) / 1000) * (stage * 10);
  const stageBonus = stage * 100;
  
  return Math.floor(baseScore + timeBonus + stageBonus);
}

