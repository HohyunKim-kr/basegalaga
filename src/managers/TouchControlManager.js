import { MODERN_COLORS } from '../utils/modernStyle.js';
import { createRexDPadButton, createRexCircleButton, activateButton, deactivateButton } from '../utils/rexUIControls.js';

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
    this.controlElements = []; // 시각적 요소 저장 (show/hide용)
    this.visible = true;
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
      this.scene.time.delayedCall(100, () => this.createControls(), [], this);
      return;
    }
    
    console.log('TouchControlManager: Creating controls, canvas:', this.gameCanvas);

    // 조이스틱 크기 (균일한 비율)
    const buttonSize = 50;
    const buttonSpacing = 60;
    
    // D-Pad 중심 위치 계산 (모든 버튼이 화면 안에 들어오도록)
    // 최소 여백 확보
    const margin = buttonSize / 2 + 20;
    const dpadX = margin + buttonSpacing;
    const dpadY = height - margin - buttonSpacing;

    // D-Pad 영역 정의 (조이스틱 영역)
    const dpadRadius = buttonSpacing + buttonSize / 2 + 8;
    this.dpadArea = {
      x: dpadX,
      y: dpadY,
      radius: dpadRadius
    };

    // 버튼 영역 정의 (정확히 균일한 간격으로 배치)
    const upY = dpadY - buttonSpacing;
    const downY = dpadY + buttonSpacing;
    const leftX = dpadX - buttonSpacing;
    const rightX = dpadX + buttonSpacing;
    
    // FIRE/SKILL 버튼 위치 (균일한 간격)
    const fireRadius = 32;
    const skillRadius = 28;
    const buttonGap = 20; // 버튼 간 간격
    const fireY = height - margin;
    const skillY = fireY - fireRadius - skillRadius - buttonGap;
    
    this.buttonAreas = [
      { id: 'up', x: dpadX, y: upY, size: buttonSize, type: 'rect' },
      { id: 'down', x: dpadX, y: downY, size: buttonSize, type: 'rect' },
      { id: 'left', x: leftX, y: dpadY, size: buttonSize, type: 'rect' },
      { id: 'right', x: rightX, y: dpadY, size: buttonSize, type: 'rect' },
      { id: 'shoot', x: width - margin - buttonSpacing, y: fireY, radius: fireRadius, type: 'circle' },
      { id: 'skill', x: width - margin - buttonSpacing, y: skillY, radius: skillRadius, type: 'circle' }
    ];

    // 시각적 버튼 생성
    this.createVisualButtons(dpadX, dpadY, buttonSpacing, buttonSize, width, height);

    // DOM 터치 이벤트 등록
    this.setupDOMTouchEvents();
  }
  
  createVisualButtons(dpadX, dpadY, buttonSpacing, buttonSize, width, height) {
    const color = MODERN_COLORS.accentPrimary; // 네온 그린
    const bgColor = 0x0a0a0a; // 더 어두운 배경
    
    // D-Pad 배경 원 (Rex UI 스타일 - 더 예쁘게)
    const dpadRadius = buttonSpacing + buttonSize / 2 + 8;
    const dpadBgOuter = this.scene.rexUI.add.roundRectangle(
      dpadX, dpadY, 
      dpadRadius * 2, 
      dpadRadius * 2,
      dpadRadius,
      bgColor, 0.7
    );
    dpadBgOuter.setStrokeStyle(3, color, 0.5);
    dpadBgOuter.setDepth(19998);
    dpadBgOuter.setScrollFactor(0);
    this.controlElements.push(dpadBgOuter);
    
    // D-Pad 내부 원 (더 깊이감)
    const dpadBgInner = this.scene.rexUI.add.roundRectangle(
      dpadX, dpadY,
      (dpadRadius - 5) * 2,
      (dpadRadius - 5) * 2,
      dpadRadius - 5,
      bgColor, 0.5
    );
    dpadBgInner.setStrokeStyle(2, color, 0.6);
    dpadBgInner.setDepth(19999);
    dpadBgInner.setScrollFactor(0);
    this.controlElements.push(dpadBgInner);
    
    // D-Pad 버튼들 (Rex UI로 생성 - 더 예쁘게)
    const upArea = this.buttonAreas.find(a => a.id === 'up');
    const downArea = this.buttonAreas.find(a => a.id === 'down');
    const leftArea = this.buttonAreas.find(a => a.id === 'left');
    const rightArea = this.buttonAreas.find(a => a.id === 'right');
    
    upArea.button = createRexDPadButton(this.scene, upArea.x, upArea.y, buttonSize, '↑', 'up');
    downArea.button = createRexDPadButton(this.scene, downArea.x, downArea.y, buttonSize, '↓', 'down');
    leftArea.button = createRexDPadButton(this.scene, leftArea.x, leftArea.y, buttonSize, '←', 'left');
    rightArea.button = createRexDPadButton(this.scene, rightArea.x, rightArea.y, buttonSize, '→', 'right');
    
    this.controlElements.push(upArea.button, downArea.button, leftArea.button, rightArea.button);
    
    // Fire 버튼 (Rex UI - 더 예쁘게)
    const fireArea = this.buttonAreas.find(a => a.id === 'shoot');
    const fireColor = MODERN_COLORS.accentPrimary; // 네온 그린
    fireArea.button = createRexCircleButton(this.scene, fireArea.x, fireArea.y, fireArea.radius, 'FIRE', 'shoot', fireColor);
    this.controlElements.push(fireArea.button);
    
    // Skill 버튼 (Rex UI - 더 예쁘게)
    const skillArea = this.buttonAreas.find(a => a.id === 'skill');
    const skillColor = MODERN_COLORS.accentTertiary; // 청록 그린
    skillArea.button = createRexCircleButton(this.scene, skillArea.x, skillArea.y, skillArea.radius, 'SKILL', 'skill', skillColor);
    this.controlElements.push(skillArea.button);
  }
  
  // D-Pad 영역 내에 있는지 확인
  isInDpadArea(x, y) {
    if (!this.dpadArea) return false;
    const dist = Math.sqrt((x - this.dpadArea.x) ** 2 + (y - this.dpadArea.y) ** 2);
    return dist <= this.dpadArea.radius;
  }
  
  setupDOMTouchEvents() {
    if (!this.gameCanvas) {
      console.error('TouchControlManager: Canvas not available for event registration');
      return;
    }
    
    // document 레벨에서 이벤트 등록 (더 확실하게 작동)
    // 기존 리스너 제거 (중복 방지)
    if (typeof document !== 'undefined') {
      document.removeEventListener('touchstart', this.boundHandleTouchStart, { capture: true });
      document.removeEventListener('touchmove', this.boundHandleTouchMove, { capture: true });
      document.removeEventListener('touchend', this.boundHandleTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', this.boundHandleTouchEnd, { capture: true });
      
      // document 레벨에서 터치 이벤트 등록
      document.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false, capture: true });
      document.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false, capture: true });
      document.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false, capture: true });
      document.addEventListener('touchcancel', this.boundHandleTouchEnd, { passive: false, capture: true });
      
      console.log('TouchControlManager: Touch events registered on document');
    }
    
    // 캔버스에도 등록 (백업)
    this.gameCanvas.removeEventListener('touchstart', this.boundHandleTouchStart, { capture: true });
    this.gameCanvas.removeEventListener('touchmove', this.boundHandleTouchMove, { capture: true });
    this.gameCanvas.removeEventListener('touchend', this.boundHandleTouchEnd, { capture: true });
    this.gameCanvas.removeEventListener('touchcancel', this.boundHandleTouchEnd, { capture: true });
    
    this.gameCanvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false, capture: true });
    this.gameCanvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false, capture: true });
    this.gameCanvas.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false, capture: true });
    this.gameCanvas.addEventListener('touchcancel', this.boundHandleTouchEnd, { passive: false, capture: true });
    
    console.log('TouchControlManager: Touch events registered on canvas');
  }
  
  getCanvasPosition(event) {
    if (!this.gameCanvas) {
      return { x: 0, y: 0 };
    }
    
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
    
    // 캔버스 영역인지 확인
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null; // 캔버스 밖
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }
  
  handleTouchStart(event) {
    if (!event || !this.gameCanvas) {
      return;
    }
    
    // GameScene이 아니면 무시 (GameOver, MainMenu 등에서는 작동 안함)
    if (!this.scene) {
      return;
    }
    
    // 씬 키 확인 (여러 방법으로 체크)
    const sceneKey = this.scene.scene?.key || this.scene.sys?.settings?.key || this.scene.sys?.scene?.key;
    if (sceneKey !== 'GameScene') {
      return; // GameScene이 아니면 완전히 무시
    }
    
    // 아이템 선택 UI가 활성화되어 있으면 무시
    if (this.scene && this.scene.itemSelectionUI) {
      return;
    }
    
    const pos = this.getCanvasPosition(event);
    if (!pos) {
      return; // 캔버스 밖 터치
    }
    
    if (!this.visible) {
      return; // 숨김 상태에서는 작동 안함
    }
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // 먼저 모든 컨트롤 리셋 (이전 터치 상태 초기화)
    this.resetAllControls();
    
    const button = this.getButtonAt(pos.x, pos.y);
    
    if (button) {
      // 버튼 터치 - 해당 방향만 활성화
      this.setControlState(button.id, true);
      this.activeButtonId = button.id; // 현재 활성화된 버튼 추적
    } else if (this.isInDpadArea(pos.x, pos.y)) {
      // D-Pad 영역 내 터치 = 이동 (조이스틱 위에서만 이동)
      this.controls.isTouching = true;
      this.controls.touchX = pos.x;
      this.controls.touchY = pos.y;
      this.activeButtonId = null;
    }
    // D-Pad 영역 밖 터치는 무시 (게임 화면 터치는 이동하지 않음)
  }
  
  handleTouchMove(event) {
    if (!event || !this.gameCanvas || !this.visible) return;
    
    // GameScene이 아니면 무시
    if (!this.scene) {
      return;
    }
    
    // 씬 키 확인
    const sceneKey = this.scene.scene?.key || this.scene.sys?.settings?.key || this.scene.sys?.scene?.key;
    if (sceneKey !== 'GameScene') {
      return; // GameScene이 아니면 완전히 무시
    }
    
    // 아이템 선택 UI가 활성화되어 있으면 무시
    if (this.scene && this.scene.itemSelectionUI) {
      return;
    }
    
    const pos = this.getCanvasPosition(event);
    if (!pos) {
      // 캔버스 밖으로 나가면 모든 컨트롤 리셋
      if (this.activeButtonId) {
        this.resetAllControls();
        this.activeButtonId = null;
      }
      return;
    }
    
    // 현재 터치 위치의 버튼 확인
    const currentButton = this.getButtonAt(pos.x, pos.y);
    
    // 이전에 버튼을 누르고 있었는데, 지금은 버튼 위가 아니면 리셋
    if (this.activeButtonId && currentButton?.id !== this.activeButtonId) {
      this.resetAllControls();
      this.activeButtonId = null;
    }
    
    // 새로운 버튼 위에 있으면 활성화
    if (currentButton && currentButton.id !== this.activeButtonId) {
      this.setControlState(currentButton.id, true);
      this.activeButtonId = currentButton.id;
    }
    
    // D-Pad 영역 내에서만 이동 처리
    if (this.controls.isTouching && this.isInDpadArea(pos.x, pos.y)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.controls.touchX = pos.x;
      this.controls.touchY = pos.y;
    } else if (this.controls.isTouching && !this.isInDpadArea(pos.x, pos.y)) {
      // D-Pad 영역 밖으로 나가면 터치 종료
      this.controls.isTouching = false;
      this.controls.touchX = null;
      this.controls.touchY = null;
    }
  }
  
  handleTouchEnd(event) {
    if (!event || !this.gameCanvas) return;
    
    // GameScene이 아니면 무시 (GameOver, MainMenu 등에서는 작동 안함)
    if (!this.scene) {
      return;
    }
    
    // 씬 키 확인 (여러 방법으로 체크)
    let sceneKey = null;
    try {
      sceneKey = this.scene.scene?.key || 
                 this.scene.sys?.settings?.key || 
                 this.scene.sys?.scene?.key ||
                 (this.scene.constructor?.name === 'GameScene' ? 'GameScene' : null);
    } catch (e) {
      // 씬 키 확인 실패 시 무시
      return;
    }
    
    // GameScene이 아니면 완전히 무시 (로그도 출력 안함)
    if (sceneKey !== 'GameScene') {
      return;
    }
    
    // 아이템 선택 UI가 활성화되어 있으면 무시
    if (this.scene && this.scene.itemSelectionUI) {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // 모든 컨트롤 즉시 리셋 (버튼을 떼면 확실히 멈춤)
    this.resetAllControls();
    this.activeButtonId = null;
    
    // 로그 제거 (GameOver 씬에서도 로그가 나타나지 않도록)
  }
  
  resetAllControls() {
    // 모든 컨트롤 상태 리셋
    this.controls.up = false;
    this.controls.down = false;
    this.controls.left = false;
    this.controls.right = false;
    this.controls.shoot = false;
    this.controls.skill = false;
    this.controls.isTouching = false;
    this.controls.touchX = null;
    this.controls.touchY = null;
    
    // 모든 버튼 시각적 피드백 리셋
    ['up', 'down', 'left', 'right', 'shoot', 'skill'].forEach(buttonId => {
      this.updateButtonVisual(buttonId, false);
    });
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
    
    // 버튼 시각적 피드백 (활성화 시 밝게, 비활성화 시 원래대로)
    this.updateButtonVisual(buttonId, state);
  }
  
  updateButtonVisual(buttonId, isActive) {
    // 버튼 시각적 피드백 (D-Pad 및 FIRE/SKILL)
    const buttonArea = this.buttonAreas.find(a => a.id === buttonId);
    if (!buttonArea) return;
    
    const button = buttonArea.button;
    if (!button) return;
    
    // Rex UI 버튼 활성화/비활성화
    if (isActive) {
      activateButton(button);
    } else {
      deactivateButton(button);
    }
  }
  
  isPointerOnButton(x, y) {
    return this.getButtonAt(x, y) !== null;
  }
  
  // 컨트롤 표시/숨김
  show() {
    this.visible = true;
    this.controlElements.forEach(element => {
      if (element && element.setVisible) {
        element.setVisible(true);
      }
    });
  }
  
  hide() {
    this.visible = false;
    this.controlElements.forEach(element => {
      if (element && element.setVisible) {
        element.setVisible(false);
      }
    });
    // 컨트롤 상태 리셋
    this.resetAllControls();
    this.activeButtonId = null;
  }
  
  getControls() {
    return this.controls;
  }
  
  destroy() {
    // document 레벨 리스너 제거
    if (typeof document !== 'undefined') {
      document.removeEventListener('touchstart', this.boundHandleTouchStart, { capture: true });
      document.removeEventListener('touchmove', this.boundHandleTouchMove, { capture: true });
      document.removeEventListener('touchend', this.boundHandleTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', this.boundHandleTouchEnd, { capture: true });
    }
    
    // 캔버스 리스너 제거
    if (this.gameCanvas) {
      this.gameCanvas.removeEventListener('touchstart', this.boundHandleTouchStart, { capture: true });
      this.gameCanvas.removeEventListener('touchmove', this.boundHandleTouchMove, { capture: true });
      this.gameCanvas.removeEventListener('touchend', this.boundHandleTouchEnd, { capture: true });
      this.gameCanvas.removeEventListener('touchcancel', this.boundHandleTouchEnd, { capture: true });
    }
    
    // 시각적 요소 제거
    this.controlElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.controlElements = [];
  }
}
