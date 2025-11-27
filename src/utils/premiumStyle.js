/**
 * Premium Sci-Fi Design System
 * Theme: Deep Space Cyberpunk / High-End Arcade
 */

export const PREMIUM_COLORS = {
  // Backgrounds
  bgDeep: 0x050510,      // Deepest space blue/black
  bgDark: 0x0f0c29,      // Dark purple/blue
  bgMedium: 0x302b63,    // Medium purple/blue
  bgLight: 0x24243e,     // Light purple/blue overlay

  // Accents (Neon)
  neonCyan: 0x00f260,    // Bright Cyan/Green (Primary Action)
  neonMagenta: 0x0575E6, // Electric Blue/Magenta (Secondary)
  neonPurple: 0xb000ff,  // Deep Purple (Special)
  neonRed: 0xff0055,     // Danger/Enemy
  neonGold: 0xffd700,    // Score/High Value

  // UI Elements
  uiGlass: 0x1a1a2e,     // Glass panel background
  uiBorder: 0x00f260,    // Panel border
  uiText: 0xffffff,      // Primary text
  uiTextDim: 0x8888aa,   // Secondary text

  // Gradients (for canvas contexts)
  gradientPrimary: ['#00f260', '#0575E6'],
  gradientDanger: ['#ff0055', '#800020']
};

export const PREMIUM_FONTS = {
  // Headers / Titles
  header: '"Orbitron", "Segoe UI", sans-serif',
  // Body / UI Text
  body: '"Rajdhani", "Segoe UI", sans-serif'
};

/**
 * Creates a premium text style with glow effect
 */
export function createPremiumTextStyle(size, color = '#ffffff', weight = '700') {
  const isNeon = color === '#00f260' || color === '#00ffff' || color === PREMIUM_COLORS.neonCyan;

  return {
    fontSize: `${size}px`,
    fontFamily: PREMIUM_FONTS.header,
    fontWeight: weight,
    color: color,
    stroke: isNeon ? '#003300' : '#000000',
    strokeThickness: isNeon ? 2 : 4,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: isNeon ? color : '#000000',
      blur: isNeon ? 15 : 8,
      stroke: true,
      fill: true
    }
  };
}

/**
 * Creates a glassmorphism panel
 */
export function createGlassPanel(scene, x, y, width, height) {
  // Main glass panel
  const panel = scene.add.rectangle(x, y, width, height, PREMIUM_COLORS.uiGlass, 0.7);
  panel.setStrokeStyle(1, 0xffffff, 0.1);
  panel.setDepth(10); // Low depth so it doesn't block buttons
  panel.disableInteractive(); // Don't block clicks

  // Top highlight (reflection)
  const highlight = scene.add.rectangle(x, y - height * 0.45, width, height * 0.1, 0xffffff, 0.1);
  highlight.setDepth(10);
  highlight.disableInteractive();

  // Corner accents (Tech look)
  const cornerSize = 10;
  const cornerColor = PREMIUM_COLORS.neonCyan;

  // Top-Left
  const tl = scene.add.line(0, 0, x - width / 2, y - height / 2 + cornerSize, x - width / 2, y - height / 2, 0x000000, 1); // dummy line to init
  tl.setTo(x - width / 2, y - height / 2 + cornerSize, x - width / 2, y - height / 2, x - width / 2 + cornerSize, y - height / 2);
  tl.setStrokeStyle(2, cornerColor, 0.8);
  tl.setDepth(10);
  tl.disableInteractive();

  // Bottom-Right
  const br = scene.add.line(0, 0, x + width / 2, y + height / 2 - cornerSize, x + width / 2, y + height / 2, 0x000000, 1);
  br.setTo(x + width / 2, y + height / 2 - cornerSize, x + width / 2, y + height / 2, x + width / 2 - cornerSize, y + height / 2);
  br.setStrokeStyle(2, cornerColor, 0.8);
  br.setDepth(10);
  br.disableInteractive();

  return { panel, highlight, tl, br };
}

/**
 * Creates a holographic button
 */
/**
 * Creates a holographic button using rectangle.setInteractive
 */
export function createHolographicButton(scene, x, y, width, height, text, callback) {
  console.log(`[Button] Creating button: "${text}" at (${x}, ${y})`);
  console.log(`[Button] Scene input enabled:`, scene.input?.enabled);
  console.log(`[Button] Scene input exists:`, !!scene.input);

  const btnColor = PREMIUM_COLORS.neonMagenta;

  // Button Background - THIS will be interactive
  const bg = scene.add.rectangle(x, y, width, height, PREMIUM_COLORS.bgMedium, 0.8);
  bg.setStrokeStyle(2, btnColor, 0.5);
  bg.setDepth(10000); // Very high depth to be above everything

  console.log(`[Button] Rectangle created for "${text}"`);

  // Make the background interactive
  bg.setInteractive({ useHandCursor: true });
  console.log(`[Button] setInteractive called for "${text}"`);
  console.log(`[Button] Rectangle.input exists:`, !!bg.input);
  console.log(`[Button] Rectangle.input.enabled:`, bg.input?.enabled);

  // Inner Glow
  const glow = scene.add.rectangle(x, y, width - 4, height - 4, btnColor, 0.1);
  glow.setDepth(10000);

  // Text
  const btnText = scene.add.text(x, y, text, {
    fontSize: '24px',
    fontFamily: PREMIUM_FONTS.header,
    color: '#ffffff',
    shadow: { color: '#0575E6', blur: 10, fill: true }
  }).setOrigin(0.5);
  btnText.setDepth(10001);

  // Hover Effects
  bg.on('pointerover', () => {
    console.log(`[Button] HOVER: "${text}"`);
    bg.setStrokeStyle(2, PREMIUM_COLORS.neonCyan, 1);
    bg.setFillStyle(PREMIUM_COLORS.bgLight, 0.9);
    glow.setFillStyle(PREMIUM_COLORS.neonCyan, 0.2);
    btnText.setColor('#00f260');
    scene.tweens.add({
      targets: [bg, glow],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      ease: 'Sine.easeInOut'
    });
  });

  bg.on('pointerout', () => {
    console.log(`[Button] HOVER OUT: "${text}"`);
    bg.setStrokeStyle(2, btnColor, 0.5);
    bg.setFillStyle(PREMIUM_COLORS.bgMedium, 0.8);
    glow.setFillStyle(btnColor, 0.1);
    btnText.setColor('#ffffff');
    scene.tweens.add({
      targets: [bg, glow],
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Sine.easeInOut'
    });
  });

  bg.on('pointerdown', () => {
    console.log(`[Button] POINTER DOWN: "${text}"`);
    bg.setFillStyle(PREMIUM_COLORS.neonCyan, 0.5);
    scene.tweens.add({
      targets: [bg, glow],
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50
    });
  });

  bg.on('pointerup', () => {
    console.log(`[Button] POINTER UP / CLICKED: "${text}"`);
    bg.setFillStyle(PREMIUM_COLORS.bgLight, 0.9);
    scene.tweens.add({
      targets: [bg, glow],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 50
    });
    console.log(`[Button] Executing callback for "${text}"`);
    if (callback) callback();
  });

  console.log(`[Button] All event listeners registered for "${text}"`);
  return { bg, glow, btnText };
}

/**
 * Creates a premium deep space background with stars and nebula
 */
export function createPremiumBackground(scene, width, height) {
  // 1. Deep Space Gradient
  const bg = scene.add.graphics();
  bg.fillGradientStyle(PREMIUM_COLORS.bgDeep, PREMIUM_COLORS.bgDeep, PREMIUM_COLORS.bgDark, PREMIUM_COLORS.bgDark, 1);
  bg.fillRect(0, 0, width, height);
  bg.setDepth(-100);
  bg.setScrollFactor(0);
  bg.setInteractive = () => { }; // Prevent from being interactive

  // 2. Nebula Effects (Procedural)
  const nebulaGroup = scene.add.group();
  const colors = [PREMIUM_COLORS.bgMedium, 0x4a00e0, 0x8e2de2]; // Purple/Blue hues

  for (let i = 0; i < 5; i++) {
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const radius = Phaser.Math.Between(200, 400);
    const color = colors[i % colors.length];

    const nebula = scene.add.circle(x, y, radius, color, 0.1);
    nebula.setBlendMode(Phaser.BlendModes.ADD);
    nebula.setDepth(-99);
    nebula.setScrollFactor(0.1); // Subtle parallax
    nebula.disableInteractive(); // CRITICAL: Don't block clicks
    nebulaGroup.add(nebula);

    // Breathing animation
    scene.tweens.add({
      targets: nebula,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 0.1, to: 0.15 },
      duration: 4000 + Math.random() * 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // 3. Starfield
  const starGroup = scene.add.group();
  const starCount = 100;

  for (let i = 0; i < starCount; i++) {
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const size = Math.random() * 2;
    const alpha = Math.random();

    const star = scene.add.circle(x, y, size, 0xffffff, alpha);
    star.setDepth(-98);
    star.setScrollFactor(Math.random() * 0.5); // Parallax based on "distance"
    star.disableInteractive(); // CRITICAL: Don't block clicks
    starGroup.add(star);

    // Twinkle animation
    if (Math.random() > 0.5) {
      scene.tweens.add({
        targets: star,
        alpha: 0,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  return { bg, nebulaGroup, starGroup };
}
