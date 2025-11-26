/**
 * Modern, clean design system - 모바일 최적화
 */

export const MODERN_COLORS = {
  // 다크 배경 (거의 검은색)
  bgPrimary: 0x000000,
  bgSecondary: 0x0a0a0a,
  bgTertiary: 0x111111,
  bgGradient: [0x000000, 0x0a0a0a, 0x111111],
  // 네온 그린 액센트
  accentPrimary: 0x00ff00,      // 밝은 네온 그린
  accentSecondary: 0x00cc00,    // 중간 그린
  accentTertiary: 0x00ff88,     // 청록 그린
  accentWarning: 0xff6b6b,
  accentSuccess: 0x00ff00,     // 네온 그린
  accentInfo: 0x00aaff,        // 네온 블루
  // 텍스트 색상
  textPrimary: '#ffffff',
  textSecondary: '#cccccc',
  textAccent: '#00ff00',       // 네온 그린
  textWarning: '#ff6b6b',
  textSuccess: '#00ff00',      // 네온 그린
  textMuted: '#666666',
  // UI 패널
  uiPanel: 0x0a0a0a,
  uiBorder: 0x00ff00,          // 네온 그린 테두리
  uiHover: 0x1a1a1a,
  // 버튼 색상
  buttonPrimary: 0x00ff00,     // 네온 그린
  buttonSecondary: 0x00cc00,
  buttonSuccess: 0x00ff00,
  buttonDanger: 0xff6b6b,
  buttonHover: 0x00cc00,
};

export const MODERN_FONT = {
  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  style: 'normal'
};

export function createModernTextStyle(size, color = '#ffffff', weight = '700') {
  // 네온 그린 텍스트는 글로우 효과 강화
  const isNeonGreen = color === '#00ff00' || color === MODERN_COLORS.textAccent;
  const isWhite = color === '#ffffff' || color === '#fff';
  
  return {
    fontSize: `${size}px`,
    fontFamily: MODERN_FONT.family,
    fontWeight: weight,
    color: color,
    // 더 세련된 스트로크
    stroke: isNeonGreen ? '#003300' : (isWhite ? '#000000' : 'rgba(0,0,0,0.5)'),
    strokeThickness: isNeonGreen ? 3 : (isWhite ? 4 : 2),
    // 다중 그림자 효과로 깊이감 추가
    shadow: {
      offsetX: 0,
      offsetY: 2,
      color: isNeonGreen ? '#00ff00' : '#000000',
      blur: isNeonGreen ? 15 : 12,
      stroke: isNeonGreen ? true : false,
      fill: true
    }
  };
}

/**
 * 모던 버튼 - DOM 터치 이벤트 사용
 */
export function createModernButton(scene, x, y, width, height, color, text, callback) {
  // 다크 블루 스타일 버튼 (이미지 참고)
  const darkBlue = 0x1a2a3a; // 다크 블루 배경
  const cyanGlow = 0x00ffff; // 사이안 글로우
  const lightBlue = 0x4a90e2; // 라이트 블루
  
  // 외부 글로우 (사이안)
  const outerGlow = scene.add.rectangle(x, y, width + 6, height + 6, cyanGlow, 0.3);
  outerGlow.setDepth(19995);
  outerGlow.setScrollFactor(0);
  
  const innerGlow = scene.add.rectangle(x, y, width + 2, height + 2, cyanGlow, 0.5);
  innerGlow.setDepth(19996);
  innerGlow.setScrollFactor(0);
  
  // 그림자 효과
  const shadow = scene.add.rectangle(x + 2, y + 2, width, height, 0x000000, 0.5);
  shadow.setDepth(19997);
  shadow.setScrollFactor(0);
  
  // 버튼 배경 (다크 블루)
  const buttonBg = scene.add.rectangle(x, y, width, height, darkBlue, 1);
  buttonBg.setDepth(19998);
  buttonBg.setScrollFactor(0);
  
  // 사이안 아웃라인 (두꺼운 글로우)
  const outline1 = scene.add.rectangle(x, y, width, height, cyanGlow, 0);
  outline1.setStrokeStyle(3, cyanGlow, 0.9);
  outline1.setDepth(19999);
  outline1.setScrollFactor(0);
  
  const outline2 = scene.add.rectangle(x, y, width - 2, height - 2, cyanGlow, 0);
  outline2.setStrokeStyle(2, cyanGlow, 0.6);
  outline2.setDepth(20000);
  outline2.setScrollFactor(0);
  
  // 베벨 효과 (3D 느낌)
  // 상단 하이라이트
  const topBevel = scene.add.rectangle(x, y - height * 0.4, width * 0.95, height * 0.15, lightBlue, 0.3);
  topBevel.setDepth(20001);
  topBevel.setScrollFactor(0);
  
  // 하단 그림자
  const bottomShadow = scene.add.rectangle(x, y + height * 0.4, width * 0.95, height * 0.15, 0x000000, 0.4);
  bottomShadow.setDepth(20001);
  bottomShadow.setScrollFactor(0);
  
  // 기하학적 디테일 (좌우 측면)
  const leftDetail = scene.add.rectangle(x - width * 0.45, y, width * 0.08, height * 0.6, darkBlue, 0.8);
  leftDetail.setStrokeStyle(1, cyanGlow, 0.4);
  leftDetail.setDepth(20002);
  leftDetail.setScrollFactor(0);
  
  const rightDetail = scene.add.rectangle(x + width * 0.45, y, width * 0.08, height * 0.6, darkBlue, 0.8);
  rightDetail.setStrokeStyle(1, cyanGlow, 0.4);
  rightDetail.setDepth(20002);
  rightDetail.setScrollFactor(0);
  
  // 버튼 텍스트 (흰색, 디지털 글리치 효과를 위한 스타일)
  const fontSize = Math.min(width / 6, 22);
  const buttonText = scene.add.text(x, y, text, {
    fontSize: `${fontSize}px`,
    fontFamily: MODERN_FONT.family,
    fontWeight: '700',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: '#000000',
      blur: 8,
      stroke: false,
      fill: true
    }
  })
    .setOrigin(0.5)
    .setDepth(20003)
    .setScrollFactor(0);
  
  // 메인 버튼 참조 (클릭 감지용)
  const button = buttonBg;
  
  // 버튼 그룹에 모든 요소 저장
  button.allElements = [outerGlow, innerGlow, shadow, buttonBg, outline1, outline2, topBevel, bottomShadow, leftDetail, rightDetail, buttonText];
  
  // 버튼 영역 정의
  const bounds = {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2
  };
  
  // DOM 터치 이벤트
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
    return px >= bounds.left && px <= bounds.right && py >= bounds.top && py <= bounds.bottom;
  };
  
  const onTouch = (event) => {
    if (!event || !canvas) return;
    
    const pos = getPos(event);
    if (pos && isInside(pos.x, pos.y)) {
      // 버튼 클릭 확인 - 이벤트 전파 완전 차단
      try {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        // 이벤트 버블링 완전 차단
        if (event.cancelBubble !== undefined) {
          event.cancelBubble = true;
        }
      } catch (e) {
        // 이미 처리된 이벤트일 수 있음
      }
      
      console.log('✅ Button clicked:', text, 'at', pos);
      
      // 모든 버튼 요소에 스케일 애니메이션 적용
      if (button.allElements) {
        button.allElements.forEach(element => {
          if (element && element.setScale) {
            scene.tweens.add({
              targets: element,
              scale: 0.95,
              duration: 100,
              ease: 'Power2',
              onComplete: () => {
                if (element && element.setScale) {
                  scene.tweens.add({
                    targets: element,
                    scale: 1,
                    duration: 150,
                    ease: 'Elastic.easeOut'
                  });
                }
              }
            });
          }
        });
      } else {
        // 폴백: 메인 버튼만
        button.setScale(0.95);
        setTimeout(() => {
          if (button && button.setScale) {
            button.setScale(1);
          }
        }, 100);
      }
      
      // 콜백 실행 (비동기로 실행하여 이벤트 처리 완료 후 실행)
      setTimeout(() => {
        try {
          callback();
        } catch (error) {
          console.error('Button callback error:', error);
        }
      }, 0);
      
      // 이벤트가 다른 핸들러로 전파되지 않도록 추가 차단
      return false;
    }
  };
  
  // 이벤트 리스너 등록 (높은 우선순위로 등록하여 TouchControlManager보다 먼저 실행)
  const setupListeners = () => {
    if (!canvas) {
      console.warn('⚠️ Canvas not available for button:', text);
      // 재시도
      setTimeout(() => {
        const retryCanvas = scene.game?.canvas;
        if (retryCanvas) {
          // document에도 등록하여 최우선 처리
          if (typeof document !== 'undefined') {
            document.addEventListener('touchstart', onTouch, { passive: false, capture: true });
            document.addEventListener('mousedown', onTouch, { capture: true });
          }
          retryCanvas.addEventListener('touchstart', onTouch, { passive: false, capture: true });
          retryCanvas.addEventListener('mousedown', onTouch, { capture: true });
          console.log('✅ Button listeners added (retry) for:', text);
        }
      }, 200);
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
      console.log('✅ Button listeners added for:', text, 'bounds:', bounds);
    } catch (error) {
      console.error('❌ Error adding button listeners:', error);
    }
  };
  
  // 즉시 설정 시도
  if (canvas) {
    setupListeners();
  } else {
    // canvas가 아직 준비되지 않았으면 재시도
    setTimeout(setupListeners, 50);
  }
  
  const cleanup = () => {
    try {
      // document 레벨 리스너 제거
      if (typeof document !== 'undefined') {
        document.removeEventListener('touchstart', onTouch, { capture: true });
        document.removeEventListener('mousedown', onTouch, { capture: true });
      }
      // canvas 리스너 제거
      if (canvas) {
        canvas.removeEventListener('touchstart', onTouch, { capture: true });
        canvas.removeEventListener('mousedown', onTouch, { capture: true });
      }
      
      // 모든 버튼 요소 제거
      if (button.allElements) {
        button.allElements.forEach(element => {
          if (element && element.destroy) {
            try {
              element.destroy();
            } catch (e) {
              // 이미 제거된 요소일 수 있음
            }
          }
        });
      }
      
      console.log('✅ Button listeners removed for:', text);
    } catch (error) {
      console.warn('⚠️ Error removing button listeners:', error);
    }
  };
  
  button.cleanup = cleanup;
  buttonText.cleanup = cleanup;
  
  return { button, text: buttonText, cleanup };
}

export function createModernPanel(scene, x, y, width, height, alpha = 0.85) {
  // 패널 그림자
  const shadow = scene.add.rectangle(x + 2, y + 2, width, height, 0x000000, 0.3);
  shadow.setDepth(99);
  
  // 패널 배경
  const panel = scene.add.rectangle(x, y, width, height, MODERN_COLORS.uiPanel, alpha);
  panel.setStrokeStyle(1, MODERN_COLORS.uiBorder, 0.2); // 네온 그린 테두리 (더 미묘하게)
  panel.setDepth(100);
  
  // 상단 하이라이트
  const highlight = scene.add.rectangle(x, y - height * 0.4, width * 0.95, height * 0.2, 0xffffff, 0.05);
  highlight.setDepth(101);
  
  // 패널 객체에 추가 요소들을 저장 (나중에 정리할 때 사용)
  panel.shadow = shadow;
  panel.highlight = highlight;
  
  // 패널 객체를 반환 (기존 코드와의 호환성 유지)
  return panel;
}

export function createModernBackground(scene, width, height) {
  // 순수 검은색 배경
  const bg = scene.add.rectangle(width / 2, height / 2, width, height, MODERN_COLORS.bgPrimary);
  bg.setDepth(-20);
  
  // 네트워크 점 효과 추가 (Dream IP 스타일)
  const dotGroup = scene.add.group();
  const dotColors = [0x00ff00, 0x00aaff, 0xff00ff, 0xffff00]; // 그린, 블루, 핑크, 옐로우
  const dotCount = 30;
  
  for (let i = 0; i < dotCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const color = dotColors[Math.floor(Math.random() * dotColors.length)];
    const size = 2 + Math.random() * 2;
    const alpha = 0.3 + Math.random() * 0.4;
    
    const dot = scene.add.circle(x, y, size, color, alpha);
    dot.setDepth(-19);
    dotGroup.add(dot);
    
    // 펄스 애니메이션
    scene.tweens.add({
      targets: dot,
      alpha: { from: alpha * 0.5, to: alpha },
      duration: 1000 + Math.random() * 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  return [bg, dotGroup];
}

export function createModernGrid(scene, width, height) {
  const gridGroup = scene.add.group();
  const gridColor = MODERN_COLORS.accentPrimary; // 네온 그린
  const gridAlpha = 0.05; // 약간 더 선명하게
  const spacing = 50;

  for (let x = 0; x < width; x += spacing) {
    const line = scene.add.line(x, height / 2, 0, -height / 2, 0, height / 2, gridColor, gridAlpha);
    line.setDepth(-10);
    gridGroup.add(line);
  }

  for (let y = 0; y < height; y += spacing) {
    const line = scene.add.line(width / 2, y, -width / 2, 0, width / 2, 0, gridColor, gridAlpha);
    line.setDepth(-10);
    gridGroup.add(line);
  }
  
  return gridGroup;
}
