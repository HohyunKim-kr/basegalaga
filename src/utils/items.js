/**
 * Item configurations
 */

export const ITEM_TYPES = {
  POWER_UP: {
    name: 'POWER_UP',
    color: 0x00ffff,
    size: 20,
    effect: 'upgradeWeapon',
    dropChance: 0.20,
    duration: 15000 // 15 seconds - temporary upgrade
  },
  HEALTH: {
    name: 'HEALTH',
    color: 0x00ff00,
    size: 20,
    effect: 'restoreHealth',
    dropChance: 0.15,
    duration: 0 // Instant effect
  },
  SPEED_UP: {
    name: 'SPEED_UP',
    color: 0xffff00,
    size: 20,
    effect: 'increaseFireRate',
    dropChance: 0.20,
    duration: 12000 // 12 seconds
  },
  SHIELD: {
    name: 'SHIELD',
    color: 0x0088ff,
    size: 20,
    effect: 'activateShield',
    dropChance: 0.15,
    duration: 15000 // 15 seconds
  },
  SCORE_BONUS: {
    name: 'SCORE_BONUS',
    color: 0xff00ff,
    size: 20,
    effect: 'scoreMultiplier',
    dropChance: 0.15,
    duration: 20000 // 20 seconds
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

