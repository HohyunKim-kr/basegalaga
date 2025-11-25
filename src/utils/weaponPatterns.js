/**
 * Weapon pattern configurations
 */

export const WEAPON_PATTERNS = {
  SINGLE: {
    name: 'SINGLE',
    bullets: 1,
    spread: 0,
    color: 0xffff00,
    size: { width: 5, height: 15 },
    speed: 500
  },
  DOUBLE: {
    name: 'DOUBLE',
    bullets: 2,
    spread: 0.1,
    color: 0x00ffff,
    size: { width: 5, height: 15 },
    speed: 500
  },
  TRIPLE: {
    name: 'TRIPLE',
    bullets: 3,
    spread: 0.15,
    color: 0x00ff00,
    size: { width: 5, height: 15 },
    speed: 500
  },
  SPREAD: {
    name: 'SPREAD',
    bullets: 5,
    spread: 0.3,
    color: 0xff00ff,
    size: { width: 5, height: 15 },
    speed: 500
  },
  LASER: {
    name: 'LASER',
    bullets: 1,
    spread: 0,
    color: 0xff0088,
    size: { width: 8, height: 20 },
    speed: 700,
    isLaser: true
  }
};

export const WEAPON_UPGRADE_ORDER = [
  'SINGLE',
  'DOUBLE',
  'TRIPLE',
  'SPREAD',
  'LASER'
];

