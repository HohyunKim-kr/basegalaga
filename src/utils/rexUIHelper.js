/**
 * Rex UI Helper - 게임 UI를 위한 헬퍼 함수들
 */
import { MODERN_COLORS } from './modernStyle.js';

/**
 * Rex UI 버튼 생성 (DOM 이벤트 지원)
 */
export function createRexButton(scene, x, y, width, height, text, callback, style = {}) {
  const {
    backgroundColor = 0x1a2a3a,
    borderColor = 0x00ffff,
    textColor = '#ffffff',
    fontSize = 20
  } = style;

  // Rex UI 버튼 생성 (borderColor 적용)
  const buttonBg = scene.rexUI.add.roundRectangle(0, 0, width, height, 10, backgroundColor, 1);
  buttonBg.setStrokeStyle(3, borderColor, 0.9);
  
  const button = scene.rexUI.add.buttons({
    x: x,
    y: y,
    width: width,
    height: height,
    orientation: 0,
    buttons: [
      scene.rexUI.add.label({
        width: width,
        height: height,
        background: buttonBg,
        text: scene.add.text(0, 0, text, {
          fontSize: `${fontSize}px`,
          fontFamily: 'Arial',
          color: textColor,
          fontWeight: 'bold'
        }),
        space: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        },
        align: 'center'
      })
    ],
    space: {
      item: 10
    }
  })
  .layout()
  .setDepth(20000)
  .setScrollFactor(0);

  // Rex UI 버튼을 명시적으로 interactive하게 설정
  if (button.setInteractive) {
    button.setInteractive();
  }
  
  // Rex UI 내장 클릭 이벤트 사용 (더 정확한 클릭 감지)
  button.on('button.click', (button, groupName, index, pointer, event) => {
    console.log('✅ Rex UI Button clicked:', text, 'scene:', scene.scene?.key, 'index:', index);
    try {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    } catch (e) {}
    
    // 버튼 클릭 애니메이션
    if (button && button.setScale) {
      button.setScale(0.95);
    }
    
    // 콜백 실행
    setTimeout(() => {
      try {
        if (callback) {
          callback();
        }
      } catch (error) {
        console.error('Button callback error:', error);
      }
      if (button && button.setScale) {
        button.setScale(1);
      }
    }, 50);
  });
  
  // 포인터 이벤트도 추가 (Rex UI 이벤트가 작동하지 않을 경우 대비)
  // Rex UI 버튼의 각 버튼 요소에 직접 이벤트 추가
  if (button.buttons && button.buttons.length > 0) {
    button.buttons.forEach((btn, idx) => {
      if (btn && btn.setInteractive) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', (pointer) => {
          console.log('✅ Button pointerdown (direct):', text, 'scene:', scene.scene?.key, 'index:', idx);
          try {
            if (pointer && pointer.event) {
              pointer.event.preventDefault();
              pointer.event.stopPropagation();
            }
          } catch (e) {}
          
          if (callback) {
            setTimeout(() => {
              try {
                callback();
              } catch (error) {
                console.error('Button callback error:', error);
              }
            }, 50);
          }
        });
      }
    });
  }

  // DOM 이벤트로 클릭 처리 (Phaser 입력 시스템 비활성화 대응)
  const canvas = scene.game.canvas;
  const getPos = (event) => {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect) return null;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event.clientX !== undefined && event.clientY !== undefined) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return null;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const isInside = (px, py) => {
    if (px === null || py === null) return false;
    // Rex UI 버튼의 실제 bounds 계산 (약간의 여유 공간 추가)
    const padding = 5; // 터치 영역 확장
    const bounds = {
      left: x - width / 2 - padding,
      right: x + width / 2 + padding,
      top: y - height / 2 - padding,
      bottom: y + height / 2 + padding
    };
    const inside = px >= bounds.left && px <= bounds.right && py >= bounds.top && py <= bounds.bottom;
    if (inside) {
      console.log('Button hit test:', { px, py, bounds, text });
    }
    return inside;
  };

  const onTouch = (event) => {
    if (!event || !canvas) return;
    
    const pos = getPos(event);
    if (!pos) return;
    
    // 씬이 활성화되어 있는지 확인
    if (!scene || !scene.scene || !scene.scene.isActive()) {
      return;
    }
    
    if (isInside(pos.x, pos.y)) {
      try {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (event.cancelBubble !== undefined) {
          event.cancelBubble = true;
        }
      } catch (e) {}

      console.log('✅ Button clicked:', text, 'at', pos, 'scene:', scene.scene?.key);
      
      // 버튼 클릭 애니메이션
      if (button && button.setScale) {
        button.setScale(0.95);
      }
      
      // 콜백 실행 (비동기로 실행하여 이벤트 처리 완료 후 실행)
      setTimeout(() => {
        try {
          if (callback) {
            callback();
          }
        } catch (error) {
          console.error('Button callback error:', error);
        }
        if (button && button.setScale) {
          button.setScale(1);
        }
      }, 50);
      
      return false;
    }
  };

  // DOM 이벤트 리스너 등록 (더 높은 우선순위)
  const setupListeners = () => {
    if (!canvas) {
      setTimeout(setupListeners, 200);
      return;
    }
    
    try {
      // 기존 리스너 제거 (중복 방지)
      if (typeof document !== 'undefined') {
        document.removeEventListener('touchstart', onTouch, { capture: true });
        document.removeEventListener('mousedown', onTouch, { capture: true });
      }
      canvas.removeEventListener('touchstart', onTouch, { capture: true });
      canvas.removeEventListener('mousedown', onTouch, { capture: true });
      
      // document 레벨에 먼저 등록 (최우선 처리)
      if (typeof document !== 'undefined') {
        document.addEventListener('touchstart', onTouch, { passive: false, capture: true });
        document.addEventListener('mousedown', onTouch, { capture: true });
      }
      // canvas에도 등록 (백업)
      canvas.addEventListener('touchstart', onTouch, { passive: false, capture: true });
      canvas.addEventListener('mousedown', onTouch, { capture: true });
      
      console.log('✅ Button listeners added for:', text, 'bounds:', { x, y, width, height });
    } catch (error) {
      console.error('Error adding button listeners:', error);
    }
  };

  if (canvas) {
    setupListeners();
  } else {
    setTimeout(setupListeners, 200);
  }

  // 클린업 함수
  const cleanup = () => {
    try {
      if (typeof document !== 'undefined') {
        document.removeEventListener('touchstart', onTouch, { capture: true });
        document.removeEventListener('mousedown', onTouch, { capture: true });
      }
      if (canvas) {
        canvas.removeEventListener('touchstart', onTouch, { capture: true });
        canvas.removeEventListener('mousedown', onTouch, { capture: true });
      }
      if (button && button.destroy) {
        button.destroy();
      }
    } catch (error) {
      console.warn('Button cleanup error:', error);
    }
  };

  button.cleanup = cleanup;
  return { button, cleanup };
}

/**
 * Rex UI 패널 생성
 */
export function createRexPanel(scene, x, y, width, height, style = {}) {
  const {
    backgroundColor = 0x0a0a0a,
    borderColor = 0x00ffff,
    borderWidth = 2,
    alpha = 0.9,
    cornerRadius = 10
  } = style;

  const panel = scene.rexUI.add.sizer({
    x: x,
    y: y,
    width: width,
    height: height,
    orientation: 0
  })
  .addBackground(
    scene.rexUI.add.roundRectangle(0, 0, 0, 0, cornerRadius, backgroundColor, alpha)
      .setStrokeStyle(borderWidth, borderColor, 0.5)
  )
  .setDepth(100)
  .setScrollFactor(0)
  .layout();

  return panel;
}

/**
 * Rex UI 라벨 생성
 */
export function createRexLabel(scene, x, y, text, style = {}) {
  const {
    fontSize = 24,
    color = '#ffffff',
    backgroundColor = null,
    padding = 10,
    cornerRadius = 5
  } = style;

  const labelConfig = {
    x: x,
    y: y,
    text: scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial',
      color: color,
      fontWeight: 'bold'
    }),
    space: {
      left: padding,
      right: padding,
      top: padding,
      bottom: padding
    },
    align: 'center'
  };

  if (backgroundColor !== null) {
    labelConfig.background = scene.rexUI.add.roundRectangle(0, 0, 0, 0, cornerRadius, backgroundColor);
  }

  const label = scene.rexUI.add.label(labelConfig)
    .layout()
    .setDepth(1000)
    .setScrollFactor(0);

  // setText 메서드 추가 (Rex UI Label 호환성)
  label.setText = function(newText) {
    if (this.childrenMap && this.childrenMap.text) {
      this.childrenMap.text.setText(newText);
    }
  };

  // setColor 메서드 추가
  label.setColor = function(color) {
    if (this.childrenMap && this.childrenMap.text) {
      this.childrenMap.text.setColor(color);
    }
  };

  // setFontSize 메서드 추가
  label.setFontSize = function(size) {
    if (this.childrenMap && this.childrenMap.text) {
      this.childrenMap.text.setFontSize(size);
    }
  };

  return label;
}

