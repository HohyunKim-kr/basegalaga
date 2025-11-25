import Phaser from 'phaser';
import { WEAPON_PATTERNS, WEAPON_UPGRADE_ORDER } from '../utils/weaponPatterns.js';
import { Bullet } from '../entities/Bullet.js';

export class WeaponManager {
  constructor(scene) {
    this.scene = scene;
    this.baseWeapon = WEAPON_PATTERNS.SINGLE;
    this.currentWeapon = WEAPON_PATTERNS.SINGLE;
    this.weaponLevel = 0;
    this.lastShotTime = 0;
    this.baseFireRate = 200;
    this.fireRate = 200;
    this.fireRateMultiplier = 1.0;
    this.bulletGroup = null;
  }
  
  setBulletGroup(group) {
    this.bulletGroup = group;
  }
  
  shoot(playerX, playerY) {
    if (!this.bulletGroup) return;
    
    const pattern = this.currentWeapon;
    const centerX = playerX;
    const startY = playerY - 30;
    
    if (pattern.bullets === 1) {
      // Single bullet
      const bullet = new Bullet(this.scene, centerX, startY, {
        width: pattern.size.width,
        height: pattern.size.height,
        color: pattern.color,
        velocityY: -pattern.speed,
        isPlayerBullet: true,
        damage: 1
      });
      this.bulletGroup.add(bullet.sprite);
    } else {
      // Multiple bullets with spread
      const totalSpread = pattern.spread * (pattern.bullets - 1);
      const startAngle = -totalSpread / 2;
      
      for (let i = 0; i < pattern.bullets; i++) {
        const angle = startAngle + (pattern.spread * i);
        const offsetX = Math.sin(angle) * 30;
        
        const bullet = new Bullet(this.scene, centerX + offsetX, startY, {
          width: pattern.size.width,
          height: pattern.size.height,
          color: pattern.color,
          velocityX: Math.sin(angle) * 100,
          velocityY: -pattern.speed,
          isPlayerBullet: true,
          damage: 1
        });
        this.bulletGroup.add(bullet.sprite);
      }
    }
  }
  
  canShoot(currentTime) {
    return currentTime - this.lastShotTime > (this.fireRate / this.fireRateMultiplier);
  }
  
  updateShotTime(currentTime) {
    this.lastShotTime = currentTime;
  }
  
  permanentUpgrade() {
    const currentIndex = WEAPON_UPGRADE_ORDER.indexOf(this.baseWeapon.name);
    if (currentIndex < WEAPON_UPGRADE_ORDER.length - 1) {
      const nextWeaponName = WEAPON_UPGRADE_ORDER[currentIndex + 1];
      this.baseWeapon = WEAPON_PATTERNS[nextWeaponName];
      this.currentWeapon = this.baseWeapon;
      this.weaponLevel = currentIndex + 1;
      return true;
    }
    return false;
  }
  
  permanentIncreaseFireRate() {
    this.baseFireRate = Math.max(100, this.baseFireRate - 30);
    this.fireRate = this.baseFireRate;
    this.fireRateMultiplier = 1.0;
  }
  
  getWeaponName() {
    return this.currentWeapon.name;
  }
  
  getWeaponColor() {
    return this.currentWeapon.color;
  }
}

