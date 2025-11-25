import { ITEM_TYPES } from '../utils/items.js';
import { MODERN_COLORS, createModernTextStyle, createModernPanel } from '../utils/modernStyle.js';
import { isMobile } from '../main.js';

export class ItemManager {
  constructor(scene) {
    this.scene = scene;
    this.itemSelectionActive = false;
    this.itemSelectionUI = null;
    this.activeEffect = null;
    this.activeEffects = {
      shield: false,
      scoreMultiplier: 1.0,
      effectTimer: null
    };
    this.shieldVisual = null;
    this.effectIndicator = null;
    this.onItemTouch = null;
  }
  
  showItemSelection() {
    if (this.itemSelectionActive) return;
    
    this.itemSelectionActive = true;
    this.scene.physics.pause();
    
    const { width, height } = this.scene.cameras.main;
    
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
    
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(1000);
    
    const panelWidth = isMobile ? width * 0.99 : width * 0.9;
    const panelHeight = isMobile ? height * 0.80 : height * 0.6;
    const panel = createModernPanel(this.scene, width / 2, height / 2, panelWidth, panelHeight, 0.95);
    panel.setStrokeStyle(3, MODERN_COLORS.accentPrimary, 1);
    panel.setDepth(1001);
    
    const titleY = isMobile ? height * 0.22 : height * 0.25;
    const title = this.scene.add.text(width / 2, titleY, 'SELECT ITEM', createModernTextStyle(isMobile ? 24 : 40, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(1002);
    
    const itemButtons = [];
    const cardAreas = [];
    
    const cardWidth = isMobile ? width * 0.3 : Math.min(200, width * 0.18);
    const cardHeight = isMobile ? height * 0.38 : Math.min(250, height * 0.4);
    const cardSpacing = isMobile ? width * 0.015 : Math.max(20, width * 0.03);
    const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
    const startX = (width - totalWidth) / 2;
    const centerY = height / 2;
    
    selectedItems.forEach((itemType, index) => {
      const x = startX + (index * (cardWidth + cardSpacing)) + (cardWidth / 2);
      const y = centerY;
      
      // 카드 영역 저장
      cardAreas.push({
        left: x - cardWidth / 2,
        right: x + cardWidth / 2,
        top: y - cardHeight / 2,
        bottom: y + cardHeight / 2,
        itemType: itemType
      });
      
      // 카드 시각적 요소 (setInteractive 없음)
      const card = this.scene.add.rectangle(x, y, cardWidth, cardHeight, itemType.color, 0.2);
      card.setStrokeStyle(2, itemType.color, 0.8);
      card.setDepth(10002);
      
      const iconSize = isMobile ? Math.min(cardWidth * 0.18, 20) : Math.min(40, cardWidth * 0.2);
      const icon = this.scene.add.circle(x, y - cardHeight * 0.2, iconSize, itemType.color);
      icon.setStrokeStyle(2, itemType.color, 1);
      icon.setDepth(1003);
      
      const nameText = this.scene.add.text(x, y + cardHeight * 0.1, itemType.name, createModernTextStyle(isMobile ? 10 : 18, `#${itemType.color.toString(16).padStart(6, '0')}`, '600'))
        .setOrigin(0.5).setDepth(1003);
      
      itemButtons.push({ card, icon, nameText, itemType });
    });
    
    // DOM 터치 이벤트로 카드 선택 처리
    const canvas = this.scene.game.canvas;
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
    
    this.onItemTouch = (event) => {
      event.preventDefault();
      const pos = getPos(event);
      for (const area of cardAreas) {
        if (pos.x >= area.left && pos.x <= area.right &&
            pos.y >= area.top && pos.y <= area.bottom) {
          self.selectItem(area.itemType);
          break;
        }
      }
    };
    
    canvas.addEventListener('touchstart', this.onItemTouch, { passive: false });
    canvas.addEventListener('mousedown', this.onItemTouch);
    
    const instructionY = isMobile ? height * 0.88 : height * 0.75;
    const instructionText = this.scene.add.text(width / 2, instructionY, 'Tap to select', createModernTextStyle(isMobile ? 12 : 16, '#ffffff', '500'))
      .setOrigin(0.5).setDepth(1003);
    
    this.itemSelectionUI = {
      overlay,
      panel,
      title,
      instructionText,
      itemButtons,
      selectedItems
    };
  }
  
  selectItem(itemType) {
    if (!this.itemSelectionActive) return;
    
    // DOM 이벤트 리스너 제거
    const canvas = this.scene.game.canvas;
    if (this.onItemTouch) {
      canvas.removeEventListener('touchstart', this.onItemTouch);
      canvas.removeEventListener('mousedown', this.onItemTouch);
      this.onItemTouch = null;
    }
    
    if (this.itemSelectionUI) {
      try {
        if (this.itemSelectionUI.overlay) this.itemSelectionUI.overlay.destroy();
        if (this.itemSelectionUI.panel) this.itemSelectionUI.panel.destroy();
        if (this.itemSelectionUI.title) this.itemSelectionUI.title.destroy();
        if (this.itemSelectionUI.instructionText) this.itemSelectionUI.instructionText.destroy();
        if (this.itemSelectionUI.itemButtons) {
          this.itemSelectionUI.itemButtons.forEach(btn => {
            if (btn.card) btn.card.destroy();
            if (btn.icon) btn.icon.destroy();
            if (btn.nameText) btn.nameText.destroy();
          });
        }
      } catch (error) {
        console.warn('Item selection cleanup error:', error);
      }
      this.itemSelectionUI = null;
    }
    
    this.itemSelectionActive = false;
    this.scene.physics.resume();
    
    if (this.onItemSelected) {
      this.onItemSelected(itemType);
    }
  }
  
  setItemSelectedCallback(callback) {
    this.onItemSelected = callback;
  }
  
  getActiveEffects() {
    return this.activeEffects;
  }
  
  getShieldVisual() {
    return this.shieldVisual;
  }
  
  setShieldVisual(visual) {
    this.shieldVisual = visual;
  }
  
  getActiveEffect() {
    return this.activeEffect;
  }
  
  setActiveEffect(effect) {
    this.activeEffect = effect;
  }
  
  destroy() {
    const canvas = this.scene.game.canvas;
    if (this.onItemTouch) {
      canvas.removeEventListener('touchstart', this.onItemTouch);
      canvas.removeEventListener('mousedown', this.onItemTouch);
    }
  }
}
