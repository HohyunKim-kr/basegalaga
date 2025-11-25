/**
 * Modern, clean design system - 모바일 최적화
 */

export const MODERN_COLORS = {
  bgPrimary: 0x0f0f23,
  bgSecondary: 0x1a1a2e,
  bgTertiary: 0x16213e,
  bgGradient: [0x0f0f23, 0x1a1a2e, 0x16213e],
  accentPrimary: 0x4a90e2,
  accentSecondary: 0x7b68ee,
  accentTertiary: 0x50c878,
  accentWarning: 0xff6b6b,
  accentSuccess: 0x51cf66,
  accentInfo: 0x74b9ff,
  textPrimary: '#ffffff',
  textSecondary: '#ffffff',
  textAccent: '#ffffff',
  textWarning: '#ffffff',
  textSuccess: '#ffffff',
  textMuted: '#ffffff',
  uiPanel: 0x1a1a2e,
  uiBorder: 0x2d2d44,
  uiHover: 0x2d2d44,
  buttonPrimary: 0x4a90e2,
  buttonSecondary: 0x7b68ee,
  buttonSuccess: 0x51cf66,
  buttonDanger: 0xff6b6b,
  buttonHover: 0x5ba0f2,
};

export const MODERN_FONT = {
  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  style: 'normal'
};

export function createModernTextStyle(size, color = '#ffffff', weight = '700') {
  return {
    fontSize: `${size}px`,
    fontFamily: MODERN_FONT.family,
    fontWeight: weight,
    color: color,
    stroke: '#000000',
    strokeThickness: 4,
    shadow: {
      offsetX: 0,
      offsetY: 3,
      color: '#000000',
      blur: 8,
      stroke: false,
      fill: true
    }
  };
}

/**
 * 모던 버튼 - DOM 터치 이벤트 사용
 */
export function createModernButton(scene, x, y, width, height, color, text, callback) {
  const button = scene.add.rectangle(x, y, width, height, color, 0.9);
  button.setStrokeStyle(2, color, 1);
  button.setDepth(20000); // 매우 높은 depth로 설정
  button.setScrollFactor(0); // 스크롤되지 않도록
  
  const buttonText = scene.add.text(x, y, text, createModernTextStyle(Math.min(width / 8, 18), '#ffffff', '600'))
    .setOrigin(0.5)
    .setDepth(20001)
    .setScrollFactor(0);
  
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
  
  const isInside = (px, py) => {
    return px >= bounds.left && px <= bounds.right && py >= bounds.top && py <= bounds.bottom;
  };
  
  const onTouch = (event) => {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const pos = getPos(event);
    if (isInside(pos.x, pos.y)) {
      button.setScale(0.95);
      callback();
      setTimeout(() => {
        if (button && button.setScale) {
          button.setScale(1);
        }
      }, 100);
    }
  };
  
  // capture: true로 설정하여 다른 이벤트보다 먼저 처리
  canvas.addEventListener('touchstart', onTouch, { passive: false, capture: true });
  canvas.addEventListener('mousedown', onTouch, { capture: true });
  
  button.cleanup = () => {
    canvas.removeEventListener('touchstart', onTouch, { capture: true });
    canvas.removeEventListener('mousedown', onTouch, { capture: true });
  };
  
  return { button, text: buttonText };
}

export function createModernPanel(scene, x, y, width, height, alpha = 0.85) {
  const panel = scene.add.rectangle(x, y, width, height, MODERN_COLORS.uiPanel, alpha);
  panel.setStrokeStyle(1, MODERN_COLORS.uiBorder, 0.5);
  return panel;
}

export function createModernBackground(scene, width, height) {
  const gradient1 = scene.add.rectangle(width / 2, 0, width, height / 3, MODERN_COLORS.bgPrimary);
  const gradient2 = scene.add.rectangle(width / 2, height / 3, width, height / 3, MODERN_COLORS.bgSecondary);
  const gradient3 = scene.add.rectangle(width / 2, (height / 3) * 2, width, height / 3, MODERN_COLORS.bgTertiary);
  
  gradient1.setDepth(-20);
  gradient2.setDepth(-20);
  gradient3.setDepth(-20);
  
  return [gradient1, gradient2, gradient3];
}

export function createModernGrid(scene, width, height) {
  const gridGroup = scene.add.group();
  const gridColor = MODERN_COLORS.accentPrimary;
  const gridAlpha = 0.03;
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
