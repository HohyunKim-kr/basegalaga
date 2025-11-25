import Phaser from 'phaser';
import { MODERN_COLORS } from '../utils/modernStyle.js';
import { isMobile } from '../main.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.health = 3;
    this.maxHealth = 3;
    
    // Create player sprite
    this.sprite = scene.add.rectangle(x, y, 40, 40, MODERN_COLORS.accentTertiary);
    scene.physics.add.existing(this.sprite);
    if (this.sprite.body) {
      this.sprite.body.setCollideWorldBounds(true);
      this.sprite.body.setImmovable(true);
    }
    
    // Player glow effect
    this.glow = scene.add.rectangle(x, y, 44, 44, MODERN_COLORS.accentTertiary, 0.2);
    this.glow.setDepth(-1);
    
    // Shield visual
    this.shieldVisual = null;
  }
  
  get x() {
    return this.sprite.x;
  }
  
  get y() {
    return this.sprite.y;
  }
  
  set x(value) {
    this.sprite.x = value;
    if (this.glow) this.glow.x = value;
  }
  
  set y(value) {
    this.sprite.y = value;
    if (this.glow) this.glow.y = value;
  }
  
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  updateGlow() {
    if (this.glow) {
      this.glow.x = this.sprite.x;
      this.glow.y = this.sprite.y;
    }
  }
  
  takeDamage(damage) {
    this.health = Math.max(0, this.health - damage);
    return this.health <= 0;
  }
  
  restoreHealth(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  setMaxHealth(newMax) {
    this.maxHealth = newMax;
    this.health = Math.min(this.health, newMax);
  }
  
  setShieldVisual(visual) {
    this.shieldVisual = visual;
  }
  
  updateShieldVisual() {
    if (this.shieldVisual) {
      try {
        if (this.shieldVisual.outer && this.shieldVisual.outer.active) {
          this.shieldVisual.outer.x = this.sprite.x;
          this.shieldVisual.outer.y = this.sprite.y;
        }
        if (this.shieldVisual.inner && this.shieldVisual.inner.active) {
          this.shieldVisual.inner.x = this.sprite.x;
          this.shieldVisual.inner.y = this.sprite.y;
        }
        if (this.shieldVisual.particles && Array.isArray(this.shieldVisual.particles)) {
          this.shieldVisual.particles.forEach((particle, i) => {
            if (particle && particle.active) {
              const time = this.scene.time.now;
              const angle = (Math.PI * 2 / 8) * i + (time * 0.001);
              particle.x = this.sprite.x + Math.cos(angle) * 50;
              particle.y = this.sprite.y + Math.sin(angle) * 50;
            }
          });
        }
      } catch (error) {
        console.warn('Shield visual update error:', error);
      }
    }
  }
  
  destroy() {
    if (this.glow) {
      this.glow.destroy();
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
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}

