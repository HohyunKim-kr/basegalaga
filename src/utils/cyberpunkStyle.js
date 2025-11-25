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
 * Create cyberpunk button with glow effect
 */
export function createCyberpunkButton(scene, x, y, width, height, color, text, callback) {
  // Button background with glow
  const button = scene.add.rectangle(x, y, width, height, color)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', callback);
  
  // Glow effect
  const glow = scene.add.rectangle(x, y, width + 4, height + 4, color, 0.3);
  glow.setDepth(-1);
  
  // Button text
  const buttonText = scene.add.text(x, y, text, createCyberpunkTextStyle(20, '#000000'))
    .setOrigin(0.5);
  
  // Hover effects
  button.on('pointerover', () => {
    button.setFillStyle(CYBERPUNK_COLORS.buttonHover);
    glow.setFillStyle(CYBERPUNK_COLORS.buttonHover, 0.5);
    glow.setSize(width + 8, height + 8);
  });
  
  button.on('pointerout', () => {
    button.setFillStyle(color);
    glow.setFillStyle(color, 0.3);
    glow.setSize(width + 4, height + 4);
  });
  
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

