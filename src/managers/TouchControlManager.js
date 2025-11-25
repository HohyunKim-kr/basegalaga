import { MODERN_COLORS, createModernTextStyle } from '../utils/modernStyle.js';

/**
 * 터치 컨트롤 매니저 - DOM 이벤트 직접 사용
 */
export class TouchControlManager {
  constructor(scene) {
    this.scene = scene;
    this.controls = {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
      skill: false,
      touchX: null,
      touchY: null,
      isTouching: false
    };
    this.buttonAreas = [];
    this.gameCanvas = null;
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
  }
  
  createControls() {
    const { width, height } = this.scene.cameras.main;

    // 캔버스 요소 가져오기
    this.gameCanvas = this.scene.game.canvas;
    
    if (!this.gameCanvas) {
      console.error('TouchControlManager: Canvas not found! Retrying...');
      // 다음 프레임에 다시 시도
      this.scene.time.delayedCall(100, () => this.createControls(), [], this);
      return;
    }

    const buttonSize = 55;
    const buttonSpacing = 65;
    
    // D-Pad 위치 (왼쪽 하단)
    const dpadX = buttonSize + 25;
    const dpadY = height - buttonSize - 90;

    // 버튼 영역 정의
    this.buttonAreas = [
      { id: 'up', x: dpadX, y: dpadY - buttonSpacing, size: buttonSize, type: 'rect' },
      { id: 'down', x: dpadX, y: dpadY + buttonSpacing, size: buttonSize, type: 'rect' },
      { id: 'left', x: dpadX - buttonSpacing, y: dpadY, size: buttonSize, type: 'rect' },
      { id: 'right', x: dpadX + buttonSpacing, y: dpadY, size: buttonSize, type: 'rect' },
      { id: 'shoot', x: width - 65, y: height - 130, radius: 35, type: 'circle' },
      { id: 'skill', x: width - 65, y: height - 220, radius: 28, type: 'circle' }
    ];

    // 시각적 버튼 생성
    this.createVisualButtons(dpadX, dpadY, buttonSpacing, buttonSize, width, height);

    // DOM 터치 이벤트 등록 (즉시 등록)
    this.setupDOMTouchEvents();
  }
  
  createVisualButtons(dpadX, dpadY, buttonSpacing, buttonSize, width, height) {
    const color = MODERN_COLORS.accentPrimary;
    
    // D-Pad 버튼들
    this.createRect(dpadX, dpadY - buttonSpacing, buttonSize, color, '↑');
    this.createRect(dpadX, dpadY + buttonSpacing, buttonSize, color, '↓');
    this.createRect(dpadX - buttonSpacing, dpadY, buttonSize, color, '←');
    this.createRect(dpadX + buttonSpacing, dpadY, buttonSize, color, '→');
    
    // Fire 버튼
    const fireBtn = this.scene.add.circle(width - 65, height - 130, 35, MODERN_COLORS.accentWarning, 0.8);
    fireBtn.setStrokeStyle(4, MODERN_COLORS.accentWarning, 1);
    fireBtn.setDepth(10000);
    fireBtn.setScrollFactor(0);
    this.scene.add.text(width - 65, height - 130, 'FIRE', createModernTextStyle(12, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(10001).setScrollFactor(0);
    
    // Skill 버튼
    const skillBtn = this.scene.add.circle(width - 65, height - 220, 28, MODERN_COLORS.accentSecondary, 0.8);
    skillBtn.setStrokeStyle(3, MODERN_COLORS.accentSecondary, 1);
    skillBtn.setDepth(10000);
    skillBtn.setScrollFactor(0);
    this.scene.add.text(width - 65, height - 220, 'SKILL', createModernTextStyle(9, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(10001).setScrollFactor(0);
  }
  
  createRect(x, y, size, color, label) {
    const btn = this.scene.add.rectangle(x, y, size, size, color, 0.8);
    btn.setStrokeStyle(3, color, 1);
    btn.setDepth(10000);
    btn.setScrollFactor(0);
    this.scene.add.text(x, y, label, createModernTextStyle(18, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(10001).setScrollFactor(0);
  }
  
  setupDOMTouchEvents() {
    if (!this.gameCanvas) {
      console.error('TouchControlManager: Canvas not available for event registration');
      return;
    }
    
    // 모바일 터치 이벤트만 등록 (키보드/마우스 비활성화)
    // capture: true로 설정하여 다른 리스너보다 먼저 처리
    this.gameCanvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false, capture: true });
    this.gameCanvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false, capture: true });
    this.gameCanvas.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false, capture: true });
    this.gameCanvas.addEventListener('touchcancel', this.boundHandleTouchEnd, { passive: false, capture: true });
  }
  
  getCanvasPosition(event) {
    const rect = this.gameCanvas.getBoundingClientRect();
    const scaleX = this.gameCanvas.width / rect.width;
    const scaleY = this.gameCanvas.height / rect.height;
    
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }
  
  handleTouchStart(event) {
    if (!event || !this.gameCanvas) return;
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const pos = this.getCanvasPosition(event);
    const button = this.getButtonAt(pos.x, pos.y);
    
    if (button) {
      this.setControlState(button.id, true);
    } else {
      // 버튼이 아닌 영역 = 이동
      this.controls.isTouching = true;
      this.controls.touchX = pos.x;
      this.controls.touchY = pos.y;
    }
  }
  
  handleTouchMove(event) {
    if (!event || !this.gameCanvas) return;
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    if (this.controls.isTouching) {
      const pos = this.getCanvasPosition(event);
      this.controls.touchX = pos.x;
      this.controls.touchY = pos.y;
    }
  }
  
  handleTouchEnd(event) {
    if (!event || !this.gameCanvas) return;
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // 모든 컨트롤 리셋
    this.controls.up = false;
    this.controls.down = false;
    this.controls.left = false;
    this.controls.right = false;
    this.controls.shoot = false;
    this.controls.skill = false;
    this.controls.isTouching = false;
    this.controls.touchX = null;
    this.controls.touchY = null;
  }
  
  getButtonAt(x, y) {
    for (const area of this.buttonAreas) {
      if (area.type === 'rect') {
        const halfSize = area.size / 2;
        if (x >= area.x - halfSize && x <= area.x + halfSize &&
            y >= area.y - halfSize && y <= area.y + halfSize) {
          return area;
        }
      } else if (area.type === 'circle') {
        const dist = Math.sqrt((x - area.x) ** 2 + (y - area.y) ** 2);
        if (dist <= area.radius) {
          return area;
        }
      }
    }
    return null;
  }
  
  setControlState(buttonId, state) {
    switch (buttonId) {
      case 'up': this.controls.up = state; break;
      case 'down': this.controls.down = state; break;
      case 'left': this.controls.left = state; break;
      case 'right': this.controls.right = state; break;
      case 'shoot': this.controls.shoot = state; break;
      case 'skill': this.controls.skill = state; break;
    }
  }
  
  isPointerOnButton(x, y) {
    return this.getButtonAt(x, y) !== null;
  }
  
  getControls() {
    return this.controls;
  }
  
  destroy() {
    if (this.gameCanvas) {
      // capture 옵션도 동일하게 제거
      this.gameCanvas.removeEventListener('touchstart', this.boundHandleTouchStart, { capture: true });
      this.gameCanvas.removeEventListener('touchmove', this.boundHandleTouchMove, { capture: true });
      this.gameCanvas.removeEventListener('touchend', this.boundHandleTouchEnd, { capture: true });
      this.gameCanvas.removeEventListener('touchcancel', this.boundHandleTouchEnd, { capture: true });
    }
  }
}
