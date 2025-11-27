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

  // 입력 시스템이 활성화되어 있는지 확인하고 필요시 재활성화
  if (scene.input) {
    scene.input.enabled = true;
    if (scene.input.mouse) scene.input.mouse.enabled = true;
    if (scene.input.touch) scene.input.touch.enabled = true;
  }

  const btnColor = PREMIUM_COLORS.neonMagenta;

  // Button Background - THIS will be interactive
  const bg = scene.add.rectangle(x, y, width, height, PREMIUM_COLORS.bgMedium, 0.8);
  bg.setStrokeStyle(2, btnColor, 0.5);
  bg.setDepth(10000); // Very high depth to be above everything

  console.log(`[Button] Rectangle created for "${text}"`);

  // Make the background interactive with larger hit area for mobile
  // 먼저 기본 interactive 설정 (더 간단한 hitArea 사용)
  bg.setInteractive({ 
    useHandCursor: true,
    pixelPerfect: false,
    alphaTolerance: 1
  });
  
  // 입력이 비활성화되어 있으면 재활성화
  if (bg.input) {
    bg.input.enabled = true;
  }
  
  // 씬이 완전히 준비될 때까지 약간 대기 후 다시 확인 및 재설정
  scene.time.delayedCall(100, () => {
    if (bg.active) {
      // 입력 시스템 재확인
      if (scene.input) {
        scene.input.enabled = true;
        if (scene.input.mouse) scene.input.mouse.enabled = true;
        if (scene.input.touch) scene.input.touch.enabled = true;
      }
      
      // 버튼 interactive 재설정
      if (bg.input) {
        bg.input.enabled = true;
      } else {
        bg.setInteractive({ 
          useHandCursor: true,
          pixelPerfect: false,
          alphaTolerance: 1
        });
      }
    }
  });
  
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
    // 입력 시스템 재확인
    if (bg.input) bg.input.enabled = true;
    if (scene.input) scene.input.enabled = true;
    
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
    // Reset button pressed state if pointer leaves
    if (buttonPressed) {
      buttonPressed = false;
    }
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


  // Track if button was pressed down (DOM 이벤트용)
  let buttonPressedDOM = false;
  
  // 입력 시스템이 비활성화되었을 때를 대비해 주기적으로 재활성화
  const ensureButtonInteractive = () => {
    if (!bg.active) return;
    
    // 씬 입력 시스템 활성화
    if (scene.input) {
      scene.input.enabled = true;
      if (scene.input.mouse) scene.input.mouse.enabled = true;
      if (scene.input.touch) scene.input.touch.enabled = true;
    }
    
    // 버튼 입력 시스템 활성화
    if (bg.input && !bg.input.enabled) {
      bg.setInteractive({ 
        useHandCursor: true,
        pixelPerfect: false,
        alphaTolerance: 1
      });
    }
  };
  
  // 주기적으로 버튼 상호작용성 확인 (2초마다)
  const checkInterval = scene.time.addEvent({
    delay: 2000,
    callback: ensureButtonInteractive,
    loop: true
  });
  
  bg.on('pointerdown', (pointer) => {
    console.log(`[Button] POINTER DOWN EVENT FIRED: "${text}"`, {
      pointer: pointer ? 'exists' : 'null',
      x: pointer?.x,
      y: pointer?.y,
      buttonInput: bg.input?.enabled,
      sceneInput: scene.input?.enabled
    });
    
    // 입력 시스템 재확인
    ensureButtonInteractive();
    
    buttonPressed = true;
    bg.setFillStyle(PREMIUM_COLORS.neonCyan, 0.5);
    scene.tweens.add({
      targets: [bg, glow],
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50
    });
  });
  
  // 추가: pointerdown이 작동하지 않을 경우를 대비해 직접 이벤트도 등록
  bg.on('pointermove', (pointer) => {
    // 디버깅: 포인터가 버튼 위에 있는지 확인
    if (pointer && pointer.isDown) {
      console.log(`[Button] POINTER MOVE (DOWN): "${text}"`);
    }
  });
  
  bg.on('pointerup', () => {
    // 입력 시스템 재확인
    ensureButtonInteractive();
    
    if (buttonPressed) {
      console.log(`[Button] POINTER UP / CLICKED: "${text}"`);
      bg.setFillStyle(PREMIUM_COLORS.bgLight, 0.9);
      scene.tweens.add({
        targets: [bg, glow],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 50
      });
      console.log(`[Button] Executing callback for "${text}"`);
      if (callback) {
        // 약간의 딜레이를 주어 애니메이션이 완료된 후 콜백 실행
        scene.time.delayedCall(50, () => {
          try {
            callback();
          } catch (error) {
            console.error(`[Button] Callback error for "${text}":`, error);
          }
        });
      }
      buttonPressed = false;
    }
  });
  
  // 모바일 터치 지원: DOM 이벤트 리스너 추가 (Phaser 이벤트와 병행)
  const canvas = scene.game.canvas;
  
  if (canvas && typeof window !== 'undefined') {
    const getCanvasPosition = (event) => {
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
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
    };
    
    // 버튼 영역 계산 (더 넓은 터치 영역 허용)
    const btnBounds = {
      left: x - width / 2 - 10,  // 여유 공간 추가
      right: x + width / 2 + 10,
      top: y - height / 2 - 10,
      bottom: y + height / 2 + 10
    };
    
    const isInsideButton = (pos) => {
      if (!pos) return false;
      const inside = pos.x >= btnBounds.left && pos.x <= btnBounds.right &&
                     pos.y >= btnBounds.top && pos.y <= btnBounds.bottom;
      return inside;
    };
    
    const handleDOMTouch = (event) => {
      // 먼저 이벤트 위치 확인 (씬 체크 전에)
      const pos = getCanvasPosition(event);
      const isInside = isInsideButton(pos);
      
      // 디버깅: 모든 터치 이벤트 로그 (모바일 디버깅용)
      if (event.type === 'touchstart' || event.type === 'touchend') {
        console.log(`[Button] DOM TOUCH EVENT (ALL): "${text}"`, {
          type: event.type,
          pos,
          isInside,
          btnBounds
        });
      }
      
      // 버튼 영역 밖이면 먼저 리턴 (성능 최적화)
      if (!isInside) {
        return;
      }
      
      // 씬이 활성화되어 있는지 확인 (여러 방법으로 체크)
      const sceneKey = scene?.scene?.key || scene?.sys?.settings?.key || scene?.sys?.scene?.key;
      const uiScenes = ['GameOver', 'MainMenu', 'Leaderboard', 'GameSummaryScene'];
      
      // UI 씬이 아니면 무시
      if (!uiScenes.includes(sceneKey)) {
        console.log(`[Button] Not UI scene, ignoring: "${text}"`, { sceneKey });
        return;
      }
      
      // 버튼 영역 내 터치 처리
      // 이벤트 전파 차단 (가장 먼저 실행 - 다른 리스너보다 우선)
      try {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (event.cancelBubble !== undefined) {
          event.cancelBubble = true;
        }
      } catch (e) {
        console.warn(`[Button] Event prevention error: "${text}"`, e);
      }
      
      console.log(`[Button] DOM TOUCH HANDLED: "${text}"`, { 
        type: event.type, 
        pos, 
        sceneKey
      });
      
      // 터치/마우스/포인터 다운 이벤트 처리
      if (event.type === 'touchstart' || event.type === 'mousedown' || event.type === 'pointerdown') {
        buttonPressedDOM = true;
        console.log(`[Button] BUTTON PRESSED (DOM): "${text}"`, { eventType: event.type, pos });
        bg.setFillStyle(PREMIUM_COLORS.neonCyan, 0.5);
        scene.tweens.add({
          targets: [bg, glow],
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 50
        });
      } 
      // 터치/마우스/포인터 업 이벤트 처리 (클릭 완료)
      else if (event.type === 'touchend' || event.type === 'mouseup' || event.type === 'touchcancel' || event.type === 'pointerup') {
        console.log(`[Button] BUTTON RELEASED (DOM): "${text}"`, { buttonPressedDOM, eventType: event.type, pos });
        if (buttonPressedDOM) {
          console.log(`[Button] DOM TOUCH END / CLICKED: "${text}"`);
          bg.setFillStyle(PREMIUM_COLORS.bgLight, 0.9);
          scene.tweens.add({
            targets: [bg, glow],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 50
          });
          
          // 콜백 실행
          if (callback) {
            console.log(`[Button] Executing callback for "${text}"`);
            setTimeout(() => {
              try {
                callback();
                console.log(`[Button] Callback executed successfully for "${text}"`);
              } catch (error) {
                console.error(`[Button] Callback error for "${text}":`, error);
              }
            }, 50);
          } else {
            console.warn(`[Button] No callback provided for "${text}"`);
          }
          buttonPressedDOM = false;
        } else {
          console.log(`[Button] Button not pressed, ignoring release for "${text}"`);
        }
      }
      
      return false;
    };
    
    // DOM 이벤트 리스너 등록 (capture: true로 높은 우선순위)
    // TouchControlManager보다 먼저 실행되도록 document 레벨에서도 등록
    const boundHandleTouch = handleDOMTouch.bind(null);
    
    // document 레벨에서 capture: true로 등록 (가장 높은 우선순위)
    // 모바일 환경에서 확실하게 작동하도록 여러 이벤트 타입 등록
    if (typeof document !== 'undefined') {
      // 터치 이벤트 (모바일)
      document.addEventListener('touchstart', boundHandleTouch, { passive: false, capture: true });
      document.addEventListener('touchend', boundHandleTouch, { passive: false, capture: true });
      document.addEventListener('touchcancel', boundHandleTouch, { passive: false, capture: true });
      // 마우스 이벤트 (웹)
      document.addEventListener('mousedown', boundHandleTouch, { capture: true });
      document.addEventListener('mouseup', boundHandleTouch, { capture: true });
      // 포인터 이벤트 (통합)
      document.addEventListener('pointerdown', boundHandleTouch, { passive: false, capture: true });
      document.addEventListener('pointerup', boundHandleTouch, { passive: false, capture: true });
      console.log(`[Button] DOM event listeners registered on document for "${text}"`);
    }
    
    // canvas에도 등록 (백업 및 추가 보장)
    canvas.addEventListener('touchstart', boundHandleTouch, { passive: false, capture: true });
    canvas.addEventListener('touchend', boundHandleTouch, { passive: false, capture: true });
    canvas.addEventListener('touchcancel', boundHandleTouch, { passive: false, capture: true });
    canvas.addEventListener('mousedown', boundHandleTouch, { capture: true });
    canvas.addEventListener('mouseup', boundHandleTouch, { capture: true });
    canvas.addEventListener('pointerdown', boundHandleTouch, { passive: false, capture: true });
    canvas.addEventListener('pointerup', boundHandleTouch, { passive: false, capture: true });
    console.log(`[Button] DOM event listeners registered on canvas for "${text}"`);
    
    // 버튼이 파괴될 때 DOM 이벤트 리스너도 제거
    bg.on('destroy', () => {
      if (checkInterval) {
        checkInterval.destroy();
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('touchstart', boundHandleTouch, { capture: true });
        document.removeEventListener('touchend', boundHandleTouch, { capture: true });
        document.removeEventListener('touchcancel', boundHandleTouch, { capture: true });
        document.removeEventListener('mousedown', boundHandleTouch, { capture: true });
        document.removeEventListener('mouseup', boundHandleTouch, { capture: true });
        document.removeEventListener('pointerdown', boundHandleTouch, { capture: true });
        document.removeEventListener('pointerup', boundHandleTouch, { capture: true });
      }
      canvas.removeEventListener('touchstart', boundHandleTouch, { capture: true });
      canvas.removeEventListener('touchend', boundHandleTouch, { capture: true });
      canvas.removeEventListener('touchcancel', boundHandleTouch, { capture: true });
      canvas.removeEventListener('mousedown', boundHandleTouch, { capture: true });
      canvas.removeEventListener('mouseup', boundHandleTouch, { capture: true });
      canvas.removeEventListener('pointerdown', boundHandleTouch, { capture: true });
      canvas.removeEventListener('pointerup', boundHandleTouch, { capture: true });
    });
  } else {
    // DOM 이벤트를 사용할 수 없는 경우 기존 방식
    bg.on('destroy', () => {
      if (checkInterval) {
        checkInterval.destroy();
      }
    });
  }

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
