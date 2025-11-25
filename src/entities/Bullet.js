import Phaser from 'phaser';

export class Bullet {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = config;
    this.isPlayerBullet = config.isPlayerBullet || false;
    
    // Create bullet sprite
    this.sprite = scene.add.rectangle(
      x, 
      y, 
      config.width || 5, 
      config.height || 15, 
      config.color || 0xffffff
    );
    
    scene.physics.add.existing(this.sprite);
    
    // Set velocity
    if (this.sprite.body) {
      if (config.velocityX !== undefined) {
        this.sprite.body.setVelocityX(config.velocityX);
      }
      if (config.velocityY !== undefined) {
        this.sprite.body.setVelocityY(config.velocityY);
      }
    }
    
    this.damage = config.damage || 1;
  }
  
  get x() {
    return this.sprite.x;
  }
  
  get y() {
    return this.sprite.y;
  }
  
  update() {
    // Remove if off screen
    const { width, height } = this.scene.cameras.main;
    if (this.isPlayerBullet && this.sprite.y < 0) {
      this.destroy();
      return false;
    }
    if (!this.isPlayerBullet && this.sprite.y > height) {
      this.destroy();
      return false;
    }
    return true;
  }
  
  destroy() {
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}

