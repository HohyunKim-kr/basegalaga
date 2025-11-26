/**
 * Rex UI 컨트롤 헬퍼 - 조이스틱과 버튼 생성
 */
import { MODERN_COLORS } from './modernStyle.js';

/**
 * Rex UI D-Pad 버튼 생성
 */
export function createRexDPadButton(scene, x, y, size, label, buttonId) {
  const color = MODERN_COLORS.accentPrimary; // 네온 그린
  const bgColor = 0x1a2a3a; // 다크 블루
  
  // Rex UI 버튼 생성 (더 예쁜 디자인)
  const button = scene.rexUI.add.label({
    x: x,
    y: y,
    width: size,
    height: size,
    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, bgColor, 1)
      .setStrokeStyle(3, color, 0.9),
    text: scene.add.text(0, 0, label, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }),
    space: {
      left: 8,
      right: 8,
      top: 8,
      bottom: 8
    },
    align: 'center'
  })
  .layout()
  .setDepth(20000)
  .setScrollFactor(0);

  // 버튼 그룹 정보 저장
  button.buttonId = buttonId;
  button.originalColor = color;
  button.bgColor = bgColor;

  return button;
}

/**
 * Rex UI 원형 버튼 생성 (FIRE, SKILL)
 */
export function createRexCircleButton(scene, x, y, radius, text, buttonId, color = MODERN_COLORS.accentPrimary) {
  const bgColor = 0x1a2a3a;
  const size = radius * 2;
  
  // Rex UI 원형 버튼 (더 예쁜 디자인)
  const button = scene.rexUI.add.label({
    x: x,
    y: y,
    width: size,
    height: size,
    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, radius, bgColor, 1)
      .setStrokeStyle(3, color, 0.9),
    text: scene.add.text(0, 0, text, {
      fontSize: `${Math.max(11, radius / 2.5)}px`,
      fontFamily: 'Arial',
      color: '#ffffff',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }),
    space: {
      left: 6,
      right: 6,
      top: 6,
      bottom: 6
    },
    align: 'center'
  })
  .layout()
  .setDepth(20000)
  .setScrollFactor(0);

  // 원형으로 만들기
  button.setSize(size, size);
  
  // 버튼 그룹 정보 저장
  button.buttonId = buttonId;
  button.originalColor = color;
  button.bgColor = bgColor;

  return button;
}

/**
 * 버튼 활성화 시각 효과
 */
export function activateButton(button) {
  if (!button) return;
  
  // 색상 변경 및 스케일 애니메이션
  if (button.childrenMap && button.childrenMap.background) {
    const bg = button.childrenMap.background;
    bg.setStrokeStyle(4, MODERN_COLORS.accentPrimary, 1);
    bg.setFillStyle(0x00ff00, 0.4);
  }
  
  // 텍스트도 더 밝게
  if (button.childrenMap && button.childrenMap.text) {
    button.childrenMap.text.setColor('#00ff00');
  }
  
  button.setScale(0.92);
}

/**
 * 버튼 비활성화 시각 효과
 */
export function deactivateButton(button) {
  if (!button) return;
  
  // 원래 색상으로 복원
  if (button.childrenMap && button.childrenMap.background) {
    const bg = button.childrenMap.background;
    bg.setStrokeStyle(3, button.originalColor || MODERN_COLORS.accentPrimary, 0.9);
    bg.setFillStyle(button.bgColor || 0x1a2a3a, 1);
  }
  
  // 텍스트도 원래대로
  if (button.childrenMap && button.childrenMap.text) {
    button.childrenMap.text.setColor('#ffffff');
  }
  
  button.setScale(1);
}

