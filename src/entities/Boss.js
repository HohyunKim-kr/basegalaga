import Phaser from 'phaser';

export class Boss {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = config;
    
    // Create boss sprite - 이미지가 있으면 이미지 사용, 없으면 사각형 사용
    const imageKey = config.bossImage || null;
    
    if (imageKey && scene.textures.exists(imageKey)) {
      // 이미지로 생성
      this.sprite = scene.add.image(x, y, imageKey);
      // 이미지 크기 조정 (config.size에 맞춤)
      this.sprite.setDisplaySize(config.size, config.size);
    } else {
      // 이미지가 없으면 기존처럼 사각형 사용
      this.sprite = scene.add.rectangle(x, y, config.size, config.size, config.color);
    }
    
    scene.physics.add.existing(this.sprite);
    if (this.sprite.body) {
      this.sprite.body.setImmovable(true);
    }
    
    // Boss properties
    this.health = config.health;
    this.maxHealth = config.health;
    this.damage = config.damage;
    this.points = config.points;
    this.pattern = config.pattern;
    
    // Pattern movement
    this.startX = x;
    this.startY = y;
    this.patternTime = 0;
    
    // Health bar
    this.healthBar = null;
    this.createHealthBar();
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
  
  createHealthBar() {
    const { width } = this.scene.cameras.main;
    this.healthBar = this.scene.add.rectangle(width / 2, 50, 200, 10, 0xff0000);
    this.healthBar.setOrigin(0.5);
    this.updateHealthBar();
  }
  
  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    const barWidth = 200 * healthPercent;
    this.healthBar.setSize(barWidth, 10);
    
    // Color based on health
    if (healthPercent > 0.5) {
      this.healthBar.setFillStyle(0xff0000);
    } else if (healthPercent > 0.25) {
      this.healthBar.setFillStyle(0xff8800);
    } else {
      this.healthBar.setFillStyle(0xffff00);
    }
  }
  
  updatePattern(time) {
    if (!this.sprite || !this.sprite.active) return;
    
    try {
      const { width } = this.scene.cameras.main;
      
      if (!this.patternTime) {
        this.patternTime = 0;
      }
      
      if (this.pattern === 'zigzag') {
        // Zigzag pattern
        this.patternTime += 0.02;
        const amplitude = width / 3;
        this.sprite.x = this.startX + Math.sin(this.patternTime) * amplitude;
        this.sprite.y = this.startY + Math.cos(this.patternTime * 2) * 30;
      } else if (this.pattern === 'spiral') {
        // Spiral pattern
        this.patternTime += 0.015;
        const radius = 100 + Math.sin(this.patternTime) * 50;
        this.sprite.x = this.startX + Math.cos(this.patternTime) * radius;
        this.sprite.y = this.startY + Math.sin(this.patternTime) * 50;
      }
    } catch (error) {
      console.warn('Boss pattern update error:', error);
    }
  }
  
  takeDamage(damage) {
    this.health -= damage;
    this.updateHealthBar();
    return this.health <= 0;
  }
  
  destroy() {
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}

