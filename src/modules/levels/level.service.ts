import { Level, ILevel, LevelAttrs } from "./level.model";

// Predefined 10 levels with XP requirements, badges, and rewards
const PREDEFINED_LEVELS: Omit<LevelAttrs, "isActive">[] = [
  {
    level: 1,
    title: "رحالة جديد",
    titleEn: "New Traveler",
    description: "بداية رحلتك في عالم القافلة",
    xpRequired: 0,
    badge: {
      key: "level_1_new_traveler",
      name: "رحالة جديد",
      icon: "🌱",
    },
    rewards: [
      { type: "badge", value: "level_1_new_traveler", name: "شارة الرحالة الجديد", icon: "🌱" },
      { type: "points", value: "100", name: "100 نقطة", icon: "⭐" },
    ],
    unlockFeatures: [],
  },
  {
    level: 2,
    title: "رحالة مبتدئ",
    titleEn: "Beginner Traveler",
    description: "أنت على الطريق الصحيح",
    xpRequired: 100,
    badge: {
      key: "level_2_beginner",
      name: "رحالة مبتدئ",
      icon: "🌿",
    },
    rewards: [
      { type: "badge", value: "level_2_beginner", name: "شارة المبتدئ", icon: "🌿" },
      { type: "dinar", value: "10", name: "10 دينار", icon: "💰" },
    ],
    unlockFeatures: [],
  },
  {
    level: 3,
    title: "رحالة نشط",
    titleEn: "Active Traveler",
    description: "أنت تتحسن يوماً بعد يوم",
    xpRequired: 250,
    badge: {
      key: "level_3_active",
      name: "رحالة نشط",
      icon: "🌳",
    },
    rewards: [
      { type: "badge", value: "level_3_active", name: "شارة النشط", icon: "🌳" },
      { type: "points", value: "250", name: "250 نقطة", icon: "⭐" },
    ],
    unlockFeatures: [],
  },
  {
    level: 4,
    title: "رحالة محترف",
    titleEn: "Professional Traveler",
    description: "مهاراتك تزداد قوة",
    xpRequired: 500,
    badge: {
      key: "level_4_professional",
      name: "رحالة محترف",
      icon: "🏆",
    },
    rewards: [
      { type: "badge", value: "level_4_professional", name: "شارة المحترف", icon: "🏆" },
      { type: "dinar", value: "25", name: "25 دينار", icon: "💰" },
    ],
    unlockFeatures: ["special_drops"],
  },
  {
    level: 5,
    title: "رحالة خبير",
    titleEn: "Expert Traveler",
    description: "أنت خبير في عالم القافلة",
    xpRequired: 1000,
    badge: {
      key: "level_5_expert",
      name: "رحالة خبير",
      icon: "👑",
    },
    rewards: [
      { type: "badge", value: "level_5_expert", name: "شارة الخبير", icon: "👑" },
      { type: "points", value: "500", name: "500 نقطة", icon: "⭐" },
    ],
    unlockFeatures: ["special_drops", "premium_items"],
  },
  {
    level: 6,
    title: "رحالة متميز",
    titleEn: "Distinguished Traveler",
    description: "أنت متميز بين الرحالة",
    xpRequired: 2000,
    badge: {
      key: "level_6_distinguished",
      name: "رحالة متميز",
      icon: "💎",
    },
    rewards: [
      { type: "badge", value: "level_6_distinguished", name: "شارة المتميز", icon: "💎" },
      { type: "dinar", value: "50", name: "50 دينار", icon: "💰" },
    ],
    unlockFeatures: ["special_drops", "premium_items"],
  },
  {
    level: 7,
    title: "رحالة أسطوري",
    titleEn: "Legendary Traveler",
    description: "أنت أسطورة في عالم القافلة",
    xpRequired: 3500,
    badge: {
      key: "level_7_legendary",
      name: "رحالة أسطوري",
      icon: "🌟",
    },
    rewards: [
      { type: "badge", value: "level_7_legendary", name: "شارة الأسطوري", icon: "🌟" },
      { type: "points", value: "1000", name: "1000 نقطة", icon: "⭐" },
    ],
    unlockFeatures: ["special_drops", "premium_items", "exclusive_drops"],
  },
  {
    level: 8,
    title: "رحالة ملوكي",
    titleEn: "Royal Traveler",
    description: "أنت من طبقة الملوك",
    xpRequired: 5500,
    badge: {
      key: "level_8_royal",
      name: "رحالة ملوكي",
      icon: "👑",
    },
    rewards: [
      { type: "badge", value: "level_8_royal", name: "شارة الملوكي", icon: "👑" },
      { type: "dinar", value: "100", name: "100 دينار", icon: "💰" },
    ],
    unlockFeatures: ["special_drops", "premium_items", "exclusive_drops"],
  },
  {
    level: 9,
    title: "رحالة إلهي",
    titleEn: "Divine Traveler",
    description: "أنت في قمة المجد",
    xpRequired: 8000,
    badge: {
      key: "level_9_divine",
      name: "رحالة إلهي",
      icon: "✨",
    },
    rewards: [
      { type: "badge", value: "level_9_divine", name: "شارة الإلهي", icon: "✨" },
      { type: "points", value: "2000", name: "2000 نقطة", icon: "⭐" },
    ],
    unlockFeatures: ["special_drops", "premium_items", "exclusive_drops", "legendary_items"],
  },
  {
    level: 10,
    title: "رحالة خالد",
    titleEn: "Immortal Traveler",
    description: "أنت الخالد في تاريخ القافلة",
    xpRequired: 12000,
    badge: {
      key: "level_10_immortal",
      name: "رحالة خالد",
      icon: "🔥",
    },
    rewards: [
      { type: "badge", value: "level_10_immortal", name: "شارة الخالد", icon: "🔥" },
      { type: "dinar", value: "200", name: "200 دينار", icon: "💰" },
      { type: "points", value: "5000", name: "5000 نقطة", icon: "⭐" },
    ],
    unlockFeatures: ["special_drops", "premium_items", "exclusive_drops", "legendary_items", "master_items"],
  },
];

/**
 * Initialize levels in database if they don't exist
 */
export async function initializeLevels() {
  for (const levelData of PREDEFINED_LEVELS) {
    await Level.findOneAndUpdate(
      { level: levelData.level },
      { ...levelData, isActive: true },
      { upsert: true, new: true }
    );
  }
}

/**
 * Get all active levels
 */
export async function getAllLevels(): Promise<ILevel[]> {
  return Level.find({ isActive: true }).sort({ level: 1 });
}

/**
 * Get level by number
 */
export async function getLevelByNumber(level: number): Promise<ILevel | null> {
  return Level.findOne({ level, isActive: true });
}

/**
 * Get user's current level based on XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  const sortedLevels = [...PREDEFINED_LEVELS].sort((a, b) => b.xpRequired - a.xpRequired);
  
  for (const levelData of sortedLevels) {
    if (totalXP >= levelData.xpRequired) {
      return levelData.level;
    }
  }
  
  return 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  const nextLevel = PREDEFINED_LEVELS.find(l => l.level === currentLevel + 1);
  if (!nextLevel) return 0; // Max level reached
  
  const currentLevelData = PREDEFINED_LEVELS.find(l => l.level === currentLevel);
  const currentXPRequired = currentLevelData?.xpRequired ?? 0;
  
  return nextLevel.xpRequired - currentXPRequired;
}


