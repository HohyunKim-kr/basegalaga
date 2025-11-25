/**
 * Modern, clean design system
 * Replaces cyberpunk with a sleek, modern aesthetic
 */

export const MODERN_COLORS = {
  // Background - Dark gradient
  bgPrimary: 0x0f0f23,
  bgSecondary: 0x1a1a2e,
  bgTertiary: 0x16213e,
  bgGradient: [0x0f0f23, 0x1a1a2e, 0x16213e],
  
  // Accent colors - Modern blue/purple palette
  accentPrimary: 0x4a90e2,      // Soft blue
  accentSecondary: 0x7b68ee,     // Soft purple
  accentTertiary: 0x50c878,      // Soft green
  accentWarning: 0xff6b6b,       // Soft red
  accentSuccess: 0x51cf66,       // Bright green
  accentInfo: 0x74b9ff,          // Light blue
  
  // Text colors - all white/bright for maximum visibility
  textPrimary: '#ffffff',
  textSecondary: '#ffffff',
  textAccent: '#ffffff',
  textWarning: '#ffffff',
  textSuccess: '#ffffff',
  textMuted: '#ffffff',
  
  // UI elements
  uiPanel: 0x1a1a2e,
  uiBorder: 0x2d2d44,
  uiHover: 0x2d2d44,
  
  // Button colors
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

/**
 * Create modern text style with better readability - pure white text, bold and clear
 */
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
 * Create modern button with smooth design
 */
export function createModernButton(scene, x, y, width, height, color, text, callback) {
  // Button background with rounded corners effect
  const button = scene.add.rectangle(x, y, width, height, color, 0.9)
    .setInteractive({ useHandCursor: true })
    .setStrokeStyle(2, color, 1);
  
  // Button text
  const buttonText = scene.add.text(x, y, text, createModernTextStyle(Math.min(width / 8, 18), '#ffffff', '600'))
    .setOrigin(0.5);
  
  // Hover effects
  button.on('pointerdown', () => {
    button.setScale(0.95);
    callback();
  });
  
  button.on('pointerup', () => {
    button.setScale(1);
  });
  
  button.on('pointerover', () => {
    button.setFillStyle(MODERN_COLORS.buttonHover, 1);
    button.setStrokeStyle(2, MODERN_COLORS.buttonHover, 1);
    scene.tweens.add({
      targets: button,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 150,
      ease: 'Power2'
    });
  });
  
  button.on('pointerout', () => {
    button.setFillStyle(color, 0.9);
    button.setStrokeStyle(2, color, 1);
    scene.tweens.add({
      targets: button,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Power2'
    });
  });
  
  return { button, text: buttonText };
}

/**
 * Create modern panel/container
 */
export function createModernPanel(scene, x, y, width, height, alpha = 0.85) {
  const panel = scene.add.rectangle(x, y, width, height, MODERN_COLORS.uiPanel, alpha);
  panel.setStrokeStyle(1, MODERN_COLORS.uiBorder, 0.5);
  return panel;
}

/**
 * Create subtle gradient background (behind everything)
 */
export function createModernBackground(scene, width, height) {
  // Create gradient effect with multiple rectangles
  const gradient1 = scene.add.rectangle(width / 2, 0, width, height / 3, MODERN_COLORS.bgPrimary);
  const gradient2 = scene.add.rectangle(width / 2, height / 3, width, height / 3, MODERN_COLORS.bgSecondary);
  const gradient3 = scene.add.rectangle(width / 2, (height / 3) * 2, width, height / 3, MODERN_COLORS.bgTertiary);
  
  // Set depth to be behind everything
  gradient1.setDepth(-20);
  gradient2.setDepth(-20);
  gradient3.setDepth(-20);
  
  return [gradient1, gradient2, gradient3];
}

/**
 * Create subtle grid overlay (behind everything)
 */
export function createModernGrid(scene, width, height) {
  const gridGroup = scene.add.group();
  const gridColor = MODERN_COLORS.accentPrimary;
  const gridAlpha = 0.03;
  const spacing = 50;

  // Vertical lines
  for (let x = 0; x < width; x += spacing) {
    const line = scene.add.line(x, height / 2, 0, -height / 2, 0, height / 2, gridColor, gridAlpha);
    line.setDepth(-10);
    gridGroup.add(line);
  }

  // Horizontal lines
  for (let y = 0; y < height; y += spacing) {
    const line = scene.add.line(width / 2, y, -width / 2, 0, width / 2, 0, gridColor, gridAlpha);
    line.setDepth(-10);
    gridGroup.add(line);
  }
  
  return gridGroup;
}

