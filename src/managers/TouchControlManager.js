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
    const color = MODERN_COLORS.accentPrimary;
    const bgColor = 0x1a1a2e;
    
    // D-Pad 배경 원 (더 예쁜 조이스틱 느낌)
    const dpadBgOuter = this.scene.add.circle(dpadX, dpadY, buttonSpacing + buttonSize / 2 + 8, bgColor, 0.6);
    dpadBgOuter.setStrokeStyle(3, color, 0.4);
    dpadBgOuter.setDepth(19998);
    dpadBgOuter.setScrollFactor(0);
    this.controlElements.push(dpadBgOuter);
    
    const dpadBgInner = this.scene.add.circle(dpadX, dpadY, buttonSpacing + buttonSize / 2 + 3, bgColor, 0.4);
    dpadBgInner.setStrokeStyle(2, color, 0.5);
    dpadBgInner.setDepth(19999);
    dpadBgInner.setScrollFactor(0);
    this.controlElements.push(dpadBgInner);
    
    // D-Pad 버튼들 (buttonAreas의 위치 사용 - 화면 안에 보장됨)
    const upArea = this.buttonAreas.find(a => a.id === 'up');
    const downArea = this.buttonAreas.find(a => a.id === 'down');
    const leftArea = this.buttonAreas.find(a => a.id === 'left');
    const rightArea = this.buttonAreas.find(a => a.id === 'right');
    
    upArea.button = this.createRect(upArea.x, upArea.y, buttonSize, color, '↑', 'up');
    downArea.button = this.createRect(downArea.x, downArea.y, buttonSize, color, '↓', 'down');
    leftArea.button = this.createRect(leftArea.x, leftArea.y, buttonSize, color, '←', 'left');
    rightArea.button = this.createRect(rightArea.x, rightArea.y, buttonSize, color, '→', 'right');
    
    // Fire 버튼 (더 예쁘게)
    const fireArea = this.buttonAreas.find(a => a.id === 'shoot');
    const fireColor = MODERN_COLORS.accentWarning;
    
    // Fire 버튼 그림자
    const fireShadow = this.scene.add.circle(fireArea.x + 2, fireArea.y + 2, fireArea.radius, 0x000000, 0.3);
    fireShadow.setDepth(19999);
    fireShadow.setScrollFactor(0);
    this.controlElements.push(fireShadow);
    
    // Fire 버튼 배경
    const fireBg = this.scene.add.circle(fireArea.x, fireArea.y, fireArea.radius, fireColor, 0.9);
    fireBg.setStrokeStyle(2, 0xffffff, 0.2);
    fireBg.setDepth(20000);
    fireBg.setScrollFactor(0);
    this.controlElements.push(fireBg);
    
    // Fire 버튼 메인
    const fireBtn = this.scene.add.circle(fireArea.x, fireArea.y, fireArea.radius - 3, fireColor, 1);
    fireBtn.setStrokeStyle(4, fireColor, 1);
    fireBtn.setDepth(20001);
    fireBtn.setScrollFactor(0);
    this.controlElements.push(fireBtn);
    
    // Fire 하이라이트
    const fireHighlight = this.scene.add.circle(fireArea.x, fireArea.y - fireArea.radius * 0.3, fireArea.radius * 0.5, 0xffffff, 0.2);
    fireHighlight.setDepth(20002);
    fireHighlight.setScrollFactor(0);
    this.controlElements.push(fireHighlight);
    
    const fireText = this.scene.add.text(fireArea.x, fireArea.y, 'FIRE', createModernTextStyle(12, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(20003).setScrollFactor(0);
    this.controlElements.push(fireText);
    
    fireArea.buttonGroup = {
      mainButton: fireBtn,
      allElements: [fireShadow, fireBg, fireBtn, fireHighlight, fireText],
      originalColor: fireColor
    };
    
    // Skill 버튼 (더 예쁘게)
    const skillArea = this.buttonAreas.find(a => a.id === 'skill');
    const skillColor = MODERN_COLORS.accentSecondary;
    
    // Skill 버튼 그림자
    const skillShadow = this.scene.add.circle(skillArea.x + 2, skillArea.y + 2, skillArea.radius, 0x000000, 0.3);
    skillShadow.setDepth(19999);
    skillShadow.setScrollFactor(0);
    this.controlElements.push(skillShadow);
    
    // Skill 버튼 배경
    const skillBg = this.scene.add.circle(skillArea.x, skillArea.y, skillArea.radius, skillColor, 0.9);
    skillBg.setStrokeStyle(2, 0xffffff, 0.2);
    skillBg.setDepth(20000);
    skillBg.setScrollFactor(0);
    this.controlElements.push(skillBg);
    
    // Skill 버튼 메인
    const skillBtn = this.scene.add.circle(skillArea.x, skillArea.y, skillArea.radius - 2, skillColor, 1);
    skillBtn.setStrokeStyle(3, skillColor, 1);
    skillBtn.setDepth(20001);
    skillBtn.setScrollFactor(0);
    this.controlElements.push(skillBtn);
    
    // Skill 하이라이트
    const skillHighlight = this.scene.add.circle(skillArea.x, skillArea.y - skillArea.radius * 0.3, skillArea.radius * 0.5, 0xffffff, 0.2);
    skillHighlight.setDepth(20002);
    skillHighlight.setScrollFactor(0);
    this.controlElements.push(skillHighlight);
    
    const skillText = this.scene.add.text(skillArea.x, skillArea.y, 'SKILL', createModernTextStyle(10, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(20003).setScrollFactor(0);
    this.controlElements.push(skillText);
    
    skillArea.buttonGroup = {
      mainButton: skillBtn,
      allElements: [skillShadow, skillBg, skillBtn, skillHighlight, skillText],
      originalColor: skillColor
    };
  }
  
  createRect(x, y, size, color, label, buttonId) {
    // 그림자 효과 (더 깊은 느낌)
    const shadow = this.scene.add.rectangle(x + 2, y + 2, size, size, 0x000000, 0.3);
    shadow.setDepth(19999);
    shadow.setScrollFactor(0);
    this.controlElements.push(shadow);
    
    // 버튼 배경 (더 밝은 그라데이션 느낌)
    const btnBg = this.scene.add.rectangle(x, y, size, size, color, 0.9);
    btnBg.setStrokeStyle(2, 0xffffff, 0.2);
    btnBg.setDepth(20000);
    btnBg.setScrollFactor(0);
    this.controlElements.push(btnBg);
    
    // 버튼 메인 (더 선명한 색상, 둥근 느낌을 위한 약간 작게)
    const btn = this.scene.add.rectangle(x, y, size - 4, size - 4, color, 0.95);
    btn.setStrokeStyle(3, color, 1);
    btn.setDepth(20001);
    btn.setScrollFactor(0);
    this.controlElements.push(btn);
    
    // 내부 하이라이트 (그라데이션 느낌)
    const highlight = this.scene.add.rectangle(x, y - size * 0.15, size - 8, size * 0.3, 0xffffff, 0.15);
    highlight.setDepth(20002);
    highlight.setScrollFactor(0);
    this.controlElements.push(highlight);
    
    // 라벨 텍스트 (더 선명하고 큰 글씨)
    const labelText = this.scene.add.text(x, y, label, createModernTextStyle(20, '#ffffff', '700'))
      .setOrigin(0.5).setDepth(20003).setScrollFactor(0);
    this.controlElements.push(labelText);
    
    // 버튼 참조 저장 (나중에 활성화 시 색상 변경용)
    const buttonGroup = {
      buttonId: buttonId,
      originalColor: color,
      mainButton: btn,
      allElements: [shadow, btnBg, btn, highlight, labelText]
    };
    
    btn.buttonGroup = buttonGroup;
    
    return buttonGroup;
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
    
    const buttonGroup = buttonArea.button || buttonArea.buttonGroup;
    if (!buttonGroup) return;
    
    const mainButton = buttonGroup.mainButton;
    
    if (isActive) {
      // 활성화 시 더 밝게, 살짝 작아지는 효과
      if (mainButton.setFillStyle) {
        mainButton.setFillStyle(buttonGroup.originalColor, 1);
      }
      mainButton.setScale(0.92);
      // 그림자도 더 진하게
      if (buttonGroup.allElements && buttonGroup.allElements[0]) {
        buttonGroup.allElements[0].setAlpha(0.5);
      }
    } else {
      // 비활성화 시 원래대로
      if (mainButton.setFillStyle) {
        const alpha = buttonId === 'shoot' || buttonId === 'skill' ? 1 : 0.95;
        mainButton.setFillStyle(buttonGroup.originalColor, alpha);
      }
      mainButton.setScale(1);
      // 그림자도 원래대로
      if (buttonGroup.allElements && buttonGroup.allElements[0]) {
        buttonGroup.allElements[0].setAlpha(0.3);
      }
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
