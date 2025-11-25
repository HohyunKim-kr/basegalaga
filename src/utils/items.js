/**
 * Item configurations
 */

export const ITEM_TYPES = {
  POWER_UP: {
    name: 'WEAPON UPGRADE',
    color: 0x4a90e2,      // Modern blue
    size: 20,
    effect: 'permanentUpgradeWeapon',
    description: 'WEAPON UPGRADE\nPERMANENT',
    duration: 0 // Permanent
  },
  HEALTH: {
    name: 'HEALTH RESTORE',
    color: 0x51cf66,      // Modern green
    size: 20,
    effect: 'permanentRestoreHealth',
    description: 'HEALTH RESTORE\nFULL HP',
    duration: 0 // Instant effect
  },
  SPEED_UP: {
    name: 'FIRE RATE BOOST',
    color: 0x74b9ff,      // Light blue
    size: 20,
    effect: 'permanentIncreaseFireRate',
    description: 'FIRE RATE +30ms\nPERMANENT',
    duration: 0 // Permanent
  },
  SHIELD: {
    name: 'MAX HEALTH UP',
    color: 0x7b68ee,      // Modern purple
    size: 20,
    effect: 'permanentIncreaseMaxHealth',
    description: 'MAX HEALTH +1\nPERMANENT',
    duration: 0 // Permanent
  },
  SCORE_BONUS: {
    name: 'SCORE MULTIPLIER',
    color: 0xff6b6b,      // Modern red/pink
    size: 20,
    effect: 'permanentIncreaseScoreMultiplier',
    description: 'SCORE MULTIPLIER +0.2\nPERMANENT',
    duration: 0 // Permanent
  }
};

/**
 * Get random item based on drop chances
 */
export function getRandomItem() {
  const items = Object.values(ITEM_TYPES);
  const totalChance = items.reduce((sum, item) => sum + item.dropChance, 0);
  const random = Math.random() * totalChance;
  
  let currentChance = 0;
  for (const item of items) {
    currentChance += item.dropChance;
    if (random <= currentChance) {
      return item;
    }
  }
  
  // Fallback to power up
  return ITEM_TYPES.POWER_UP;
}

