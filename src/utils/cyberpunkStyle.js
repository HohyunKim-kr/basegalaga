/**
 * Cyberpunk style constants and utilities
 */

export const CYBERPUNK_COLORS = {
  // Background colors
  bgDark: 0x0a0a0a,
  bgPurple: 0x1a0033,
  bgBlue: 0x000033,
  bgGradient: [0x0a0a0a, 0x1a0033, 0x000033],
  
  // Neon colors
  neonPink: 0xff00ff,
  neonCyan: 0x00ffff,
  neonPurple: 0x8800ff,
  neonYellow: 0xffff00,
  neonGreen: 0x00ff00,
  neonBlue: 0x0088ff,
  neonRed: 0xff0088,
  
  // Text colors
  textPrimary: '#00ffff',
  textSecondary: '#ff00ff',
  textAccent: '#ffff00',
  textWarning: '#ff0088',
  textSuccess: '#00ff00',
  
  // Button colors
  buttonPrimary: 0x00ffff,
  buttonSecondary: 0xff00ff,
  buttonHover: 0x00ff88,
};

export const CYBERPUNK_FONT = {
  family: 'Courier New, monospace',
  style: 'bold'
};

/**
 * Create cyberpunk text style
 */
export function createCyberpunkTextStyle(size, color = CYBERPUNK_COLORS.textPrimary) {
  return {
    fontSize: `${size}px`,
    fontFamily: CYBERPUNK_FONT.family,
    fontStyle: CYBERPUNK_FONT.style,
    color: color,
    stroke: '#000000',
    strokeThickness: 2,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: color,
      blur: 2,
      stroke: true,
      fill: true
    }
  };
}

/**
 * Create cyberpunk button with glow effect - DOM 터치 이벤트 사용
 */
export function createCyberpunkButton(scene, x, y, width, height, color, text, callback) {
  // Button background with glow
  const button = scene.add.rectangle(x, y, width, height, color);
  
  // Glow effect
  const glow = scene.add.rectangle(x, y, width + 4, height + 4, color, 0.3);
  glow.setDepth(-1);
  
  // Button text
  const buttonText = scene.add.text(x, y, text, createCyberpunkTextStyle(20, '#000000'))
    .setOrigin(0.5);
  
  // DOM 터치 이벤트
  const canvas = scene.game.canvas;
  const bounds = {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2
  };
  
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
    event.preventDefault();
    const pos = getPos(event);
    if (isInside(pos.x, pos.y)) {
      button.setFillStyle(CYBERPUNK_COLORS.buttonHover);
      callback();
      setTimeout(() => button.setFillStyle(color), 100);
    }
  };
  
  canvas.addEventListener('touchstart', onTouch, { passive: false });
  canvas.addEventListener('mousedown', onTouch);
  
  button.cleanup = () => {
    canvas.removeEventListener('touchstart', onTouch);
    canvas.removeEventListener('mousedown', onTouch);
  };
  
  return { button, glow, text: buttonText };
}

/**
 * Create scanline effect
 */
export function createScanlines(scene, width, height) {
  const scanlineGroup = scene.add.group();
  const lineHeight = 2;
  const spacing = 4;
  
  for (let y = 0; y < height; y += spacing) {
    const line = scene.add.rectangle(width / 2, y, width, lineHeight, 0x00ffff, 0.05);
    scanlineGroup.add(line);
  }
  
  return scanlineGroup;
}
