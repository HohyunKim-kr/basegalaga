import Phaser from 'phaser';

export class Enemy {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = config;
    
    // Create enemy sprite
    this.sprite = scene.add.rectangle(x, y, 30, 30, config.enemyColor);
    scene.physics.add.existing(this.sprite);
    if (this.sprite.body) {
      this.sprite.body.setImmovable(true);
    }
    
    // Enemy properties
    this.health = config.enemyHealth;
    this.maxHealth = config.enemyHealth;
    this.damage = config.enemyDamage;
    this.points = config.enemyPoints;
    
    // Formation position
    this.originalX = x;
    this.originalY = y;
    this.isDiving = false;
    this.diveTimer = scene.time.now + Phaser.Math.Between(5000, 15000);
    
    // Movement tween
    this.movementTween = null;
  }
  
  get x() {
    return this.sprite.x;
  }
  
  get y() {
    return this.sprite.y;
  }
  
  get active() {
    return this.sprite && this.sprite.active;
  }
  
  startFormationMovement(index) {
    if (!this.sprite || !this.sprite.active) return;
    
    try {
      this.movementTween = this.scene.tweens.add({
        targets: this.sprite,
        x: this.sprite.x + 100,
        duration: 2000 + (index % 3) * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: index * 100
      });
    } catch (error) {
      console.warn('Formation movement error:', error);
    }
  }
  
  startDive() {
    if (!this.sprite || !this.sprite.active || this.isDiving) return;
    
    this.isDiving = true;
    if (this.sprite.body) {
      this.sprite.body.setImmovable(false);
      this.sprite.body.setVelocityY(150);
      this.sprite.body.setVelocityX(Phaser.Math.Between(-100, 100));
      this.sprite.body.setBounce(0.5, 0.5);
      this.sprite.body.setCollideWorldBounds(true);
    }
    
    // Stop formation movement
    if (this.movementTween) {
      this.movementTween.stop();
      this.movementTween = null;
    }
    
    // Return to formation after a while
    this.scene.time.delayedCall(3000, () => {
      if (this.sprite && this.sprite.active) {
        this.returnToFormation();
      }
    });
  }
  
  returnToFormation() {
    if (!this.sprite || !this.sprite.active) return;
    
    this.isDiving = false;
    const tween = this.scene.tweens.add({
      targets: this.sprite,
      x: this.originalX,
      y: this.originalY,
      duration: 2000,
      onComplete: () => {
        if (this.sprite && this.sprite.active && this.sprite.body) {
          this.sprite.body.setImmovable(true);
          this.sprite.body.setVelocity(0, 0);
        }
      }
    });
  }
  
  takeDamage(damage) {
    this.health -= damage;
    return this.health <= 0;
  }
  
  shouldDive(currentTime) {
    return this.diveTimer && currentTime > this.diveTimer && !this.isDiving;
  }
  
  destroy() {
    if (this.movementTween) {
      this.movementTween.stop();
      this.movementTween = null;
    }
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}

