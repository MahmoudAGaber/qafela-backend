export type BaseRarity = "common" | "rare" | "legendary";
export type ItemRarity =
  | "common"
  | "rare"
  | "legendary"
  | "barter"
  | "barter_result";

export interface BaseItem {
  key: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  stock?: number;
  maxPerUser?: number | null;
}

export interface NormalItem extends BaseItem {
  rarity: "common" | "rare" | "legendary";
  priceDinar?: number;
  givesPoints: number;
  stock: number;
}

export interface BarterItem extends BaseItem {
  rarity: "barter";
  priceDinar: number;
  givesPoints: 0;
  stock: number;
}

export interface BarterResultItem extends BaseItem {
  rarity: "barter_result";
  priceDinar?: 0;
  givesPoints: number;
}

export type GameItem = NormalItem | BarterItem | BarterResultItem;

export const isBarterItem = (item: GameItem): item is BarterItem =>
  item.rarity === "barter";
export const isBarterResult = (item: GameItem): item is BarterResultItem =>
  item.rarity === "barter_result";
export const baseRarity = (rarity: ItemRarity): BaseRarity | null => {
  if (rarity === "common" || rarity === "rare" || rarity === "legendary") return rarity;
  return null;
};
export const isNormalItem = (item: GameItem): item is NormalItem =>
  baseRarity(item.rarity) !== null;

export type CaravanDropDefinition = GameItem;

export interface CaravanBarterType {
  key: string;
  title_ar: string;
  title_en: string;
  rarity: ItemRarity;
  icon: string;
  points: number;
  source: "recipe" | "fallback" | string;
}

export interface CaravanRecipe {
  inputs: [string, string];
  outputKey: string;
}

export interface CaravanContent {
  drops: CaravanDropDefinition[];
  barterTypes: CaravanBarterType[];
  recipes: CaravanRecipe[];
  fallbacks: Record<string, string>;
}

export const caravanContent: CaravanContent = {
  "drops": [
    {
      "key": "soap_olive",
      "title_ar": "صابونة زيت زيتون",
      "title_en": "Olive Oil Soap",
      "description_ar": "صابونة تقليدية من زيت الزيتون.",
      "description_en": "Traditional olive oil soap bar.",
      "rarity": "barter",
      "priceDinar": 5,
      "givesPoints": 0,
      "stock": 40,
      "maxPerUser": 5,
      "icon": "soap_olive"
    },
    {
      "key": "perfume_basic",
      "title_ar": "قنينة عطر بسيطة",
      "title_en": "Basic Perfume Bottle",
      "description_ar": "رائحة خفيفة تناسب الاستعمال اليومي.",
      "description_en": "Light scent for everyday use.",
      "rarity": "common",
      "priceDinar": 8,
      "givesPoints": 3,
      "stock": 35,
      "maxPerUser": 4,
      "icon": "perfume_basic"
    },
    {
      "key": "pearl_shell",
      "title_ar": "صدفة بلؤلؤة",
      "title_en": "Pearl in Shell",
      "description_ar": "لؤلؤة لامعة من أعماق الخليج.",
      "description_en": "Shiny pearl from the gulf.",
      "rarity": "rare",
      "priceDinar": 25,
      "givesPoints": 12,
      "stock": 15,
      "maxPerUser": 2,
      "icon": "pearl_shell"
    },
    {
      "key": "blue_gem",
      "title_ar": "جوهرة زرقاء",
      "title_en": "Blue Gemstone",
      "description_ar": "حجر كريم نادر.",
      "description_en": "A rare blue gemstone.",
      "rarity": "rare",
      "priceDinar": 60,
      "givesPoints": 35,
      "stock": 8,
      "maxPerUser": 1,
      "icon": "blue_gem"
    },
    {
      "key": "steel_oil_drum",
      "title_ar": "برميل زيت معدني",
      "title_en": "Steel Oil Drum",
      "description_ar": "برميل زيت صناعي ضخم.",
      "description_en": "Large industrial oil drum.",
      "rarity": "rare",
      "priceDinar": 32,
      "givesPoints": 14,
      "stock": 18,
      "maxPerUser": 3,
      "icon": "steel_oil_drum"
    },
    {
      "key": "tar_wooden_barrel",
      "title_ar": "برميل قطران خشبي",
      "title_en": "Wooden Tar Barrel",
      "description_ar": "برميل خشبي مليء بالقطران.",
      "description_en": "Wooden barrel filled with tar.",
      "rarity": "barter",
      "priceDinar": 10,
      "givesPoints": 0,
      "stock": 30,
      "maxPerUser": 4,
      "icon": "tar_wooden_barrel"
    },
    {
      "key": "clay_bricks_stack",
      "title_ar": "رُزم طوب طيني",
      "title_en": "Clay Bricks Stack",
      "description_ar": "طوب للبناء التقليدي.",
      "description_en": "Clay bricks for building.",
      "rarity": "barter",
      "priceDinar": 7,
      "givesPoints": 0,
      "stock": 45,
      "maxPerUser": 6,
      "icon": "clay_bricks_stack"
    },
    {
      "key": "tree_stump_log",
      "title_ar": "جذع خشب",
      "title_en": "Wood Tree Stump",
      "description_ar": "خشب جاهز للتقطيع.",
      "description_en": "Tree stump ready for cutting.",
      "rarity": "barter",
      "priceDinar": 6,
      "givesPoints": 0,
      "stock": 40,
      "maxPerUser": 6,
      "icon": "tree_stump_log"
    },
    {
      "key": "seed_sack",
      "title_ar": "كيس بذور",
      "title_en": "Seed Sack",
      "description_ar": "بذور قابلة للزراعة.",
      "description_en": "Plantable seed sack.",
      "rarity": "barter",
      "priceDinar": 5,
      "givesPoints": 0,
      "stock": 50,
      "maxPerUser": 8,
      "icon": "seed_sack"
    },
    {
      "key": "salt_sack",
      "title_ar": "كيس ملح",
      "title_en": "Salt Sack",
      "description_ar": "ملح خشن للتجارة.",
      "description_en": "Coarse salt for trade.",
      "rarity": "barter",
      "priceDinar": 4,
      "givesPoints": 0,
      "stock": 50,
      "maxPerUser": 8,
      "icon": "salt_sack"
    },
    {
      "key": "flour_sack",
      "title_ar": "كيس دقيق",
      "title_en": "Flour Sack",
      "description_ar": "دقيق للخبز اليومي.",
      "description_en": "Flour for daily bread.",
      "rarity": "barter",
      "priceDinar": 6,
      "givesPoints": 0,
      "stock": 45,
      "maxPerUser": 6,
      "icon": "flour_sack"
    },
    {
      "key": "rice_sack",
      "title_ar": "كيس أرز",
      "title_en": "Rice Sack",
      "description_ar": "أرز أبيض ذو جودة جيدة.",
      "description_en": "White rice of good quality.",
      "rarity": "barter",
      "priceDinar": 7,
      "givesPoints": 0,
      "stock": 40,
      "maxPerUser": 5,
      "icon": "rice_sack"
    },
    {
      "key": "honey_jar",
      "title_ar": "برطمان عسل",
      "title_en": "Honey Jar",
      "description_ar": "عسل طبيعي من الجبال.",
      "description_en": "Natural mountain honey.",
      "rarity": "rare",
      "priceDinar": 18,
      "givesPoints": 9,
      "stock": 25,
      "maxPerUser": 3,
      "icon": "honey_jar"
    },
    {
      "key": "milk_jug",
      "title_ar": "إبريق لبن",
      "title_en": "Milk Jug",
      "description_ar": "لبن طازج من المزرعة.",
      "description_en": "Fresh farm milk.",
      "rarity": "barter",
      "priceDinar": 6,
      "givesPoints": 0,
      "stock": 35,
      "maxPerUser": 4,
      "icon": "milk_jug"
    },
    {
      "key": "nuts_sack",
      "title_ar": "كيس مكسرات",
      "title_en": "Mixed Nuts Sack",
      "description_ar": "مكسرات محمصة عالية الجودة.",
      "description_en": "High quality roasted nuts.",
      "rarity": "barter",
      "priceDinar": 20,
      "givesPoints": 0,
      "stock": 20,
      "maxPerUser": 3,
      "icon": "nuts_sack"
    },
    {
      "key": "fruit_basket",
      "title_ar": "سلة فواكه",
      "title_en": "Fruit Basket",
      "description_ar": "تشكيلة فواكه طازجة.",
      "description_en": "Assorted fresh fruits.",
      "rarity": "barter",
      "priceDinar": 22,
      "givesPoints": 0,
      "stock": 18,
      "maxPerUser": 3,
      "icon": "fruit_basket"
    },
    {
      "key": "spice_chest",
      "title_ar": "صندوق توابل",
      "title_en": "Spice Chest",
      "description_ar": "خليط توابل من الشرق.",
      "description_en": "Assorted eastern spices.",
      "rarity": "barter",
      "priceDinar": 24,
      "givesPoints": 0,
      "stock": 18,
      "maxPerUser": 3,
      "icon": "spice_chest"
    },
    {
      "key": "water_barrel",
      "title_ar": "برميل ماء",
      "title_en": "Water Barrel",
      "description_ar": "برميل ماء عذب للقافلة.",
      "description_en": "Fresh water barrel for the caravan.",
      "rarity": "barter",
      "priceDinar": 5,
      "givesPoints": 0,
      "stock": 40,
      "maxPerUser": 5,
      "icon": "water_barrel"
    },
    {
      "key": "fine_flour_sack",
      "title_ar": "كيس دقيق فاخر",
      "title_en": "Fine Flour Sack",
      "description_ar": "دقيق فاخر للحلويات.",
      "description_en": "Fine flour for sweets.",
      "rarity": "barter",
      "priceDinar": 14,
      "givesPoints": 0,
      "stock": 22,
      "maxPerUser": 3,
      "icon": "fine_flour_sack"
    },
    {
      "key": "royal_perfume",
      "title_ar": "عطر ملكي",
      "title_en": "Royal Perfume",
      "description_ar": "خليط عطور نادر وفاخر.",
      "description_en": "Luxurious blend of rare scents.",
      "rarity": "barter",
      "priceDinar": 55,
      "givesPoints": 0,
      "stock": 10,
      "maxPerUser": 1,
      "icon": "royal_perfume"
    },
    {
      "key": "attar_bottle",
      "title_ar": "قنينة دهن عود",
      "title_en": "Oud Attar Bottle",
      "description_ar": "دهن عود مركز.",
      "description_en": "Concentrated oud attar.",
      "rarity": "barter",
      "priceDinar": 48,
      "givesPoints": 0,
      "stock": 10,
      "maxPerUser": 1,
      "icon": "attar_bottle"
    },
    {
      "key": "red_perfume_bottle",
      "title_ar": "قارورة عطر حمراء",
      "title_en": "Red Perfume Flask",
      "description_ar": "عطر شرقي قوي.",
      "description_en": "Strong oriental perfume.",
      "rarity": "rare",
      "priceDinar": 26,
      "givesPoints": 13,
      "stock": 18,
      "maxPerUser": 2,
      "icon": "red_perfume_bottle"
    },
    {
      "key": "village_well",
      "title_ar": "بئر القرية",
      "title_en": "Village Well",
      "description_ar": "بئر ماء قديم، رمزي للقافلة.",
      "description_en": "Old water well, symbolic item.",
      "rarity": "barter",
      "priceDinar": 28,
      "givesPoints": 0,
      "stock": 12,
      "maxPerUser": 1,
      "icon": "village_well"
    },
    {
      "key": "desert_horse_brown",
      "title_ar": "حصان عربي بني",
      "title_en": "Brown Arabian Horse",
      "description_ar": "حصان سريع يناسب السفر.",
      "description_en": "Fast horse for travel.",
      "rarity": "barter",
      "priceDinar": 80,
      "givesPoints": 0,
      "stock": 5,
      "maxPerUser": 1,
      "icon": "desert_horse_brown"
    },
    {
      "key": "desert_horse_black",
      "title_ar": "حصان عربي أسود",
      "title_en": "Black Arabian Stallion",
      "description_ar": "حصان أسطوري نادر.",
      "description_en": "Legendary black stallion.",
      "rarity": "barter",
      "priceDinar": 150,
      "givesPoints": 0,
      "stock": 2,
      "maxPerUser": 1,
      "icon": "desert_horse_black"
    },
    {
      "key": "honey_pot_large",
      "title_ar": "قدر عسل كبير",
      "title_en": "Large Honey Pot",
      "description_ar": "كمية كبيرة من العسل الفاخر.",
      "description_en": "A large pot of premium honey.",
      "rarity": "rare",
      "priceDinar": 30,
      "givesPoints": 15,
      "stock": 12,
      "maxPerUser": 2,
      "icon": "honey_pot_large"
    },
    {
      "key": "yogurt_jug",
      "title_ar": "إبريق لبن رائب",
      "title_en": "Yogurt Jug",
      "description_ar": "شراب لبن تقليدي.",
      "description_en": "Traditional yogurt drink.",
      "rarity": "barter",
      "priceDinar": 7,
      "givesPoints": 0,
      "stock": 30,
      "maxPerUser": 4,
      "icon": "yogurt_jug"
    },
    {
      "key": "gold_card",
      "title_ar": "بطاقة ذهبية",
      "title_en": "Gold Trade Card",
      "description_ar": "بطاقة ذهبية خاصة بالتجار.",
      "description_en": "Golden trade card for merchants.",
      "rarity": "barter",
      "priceDinar": 65,
      "givesPoints": 0,
      "stock": 6,
      "maxPerUser": 1,
      "icon": "gold_card"
    },
    {
      "key": "dinar_coin",
      "title_ar": "دينار ذهبي",
      "title_en": "Golden Dinar",
      "description_ar": "عملة ذهبية لامعة.",
      "description_en": "Shiny golden coin.",
      "rarity": "barter",
      "priceDinar": 0,
      "givesPoints": 0,
      "stock": 999,
      "maxPerUser": null,
      "icon": "dinar_coin"
    },
    {
      "key": "treasure_chest_legendary",
      "title_ar": "صندوق كنز أسطوري",
      "title_en": "Legendary Treasure Chest",
      "description_ar": "صندوق مليء بالجواهر والذهب.",
      "description_en": "Chest full of gold and gems.",
      "rarity": "barter",
      "priceDinar": 220,
      "givesPoints": 0,
      "stock": 1,
      "maxPerUser": 1,
      "icon": "treasure_chest_legendary"
    },
    {
      "key": "golden_watch",
      "title_ar": "ساعة ذهبية",
      "title_en": "Golden Watch",
      "description_ar": "ساعة فاخرة للتجار الكبار.",
      "description_en": "Luxurious golden wristwatch.",
      "rarity": "barter",
      "priceDinar": 90,
      "givesPoints": 0,
      "stock": 4,
      "maxPerUser": 1,
      "icon": "golden_watch"
    },
    {
      "key": "date_palm_gold",
      "title_ar": "نخلة تمور ذهبية",
      "title_en": "Golden Date Palm",
      "description_ar": "نخلة مزخرفة محملة بالتمر.",
      "description_en": "Decorative palm loaded with dates.",
      "rarity": "barter",
      "priceDinar": 200,
      "givesPoints": 0,
      "stock": 2,
      "maxPerUser": 1,
      "icon": "date_palm_gold"
    },
    {
      "key": "date_palm_plain",
      "title_ar": "نخلة صحراوية",
      "title_en": "Desert Palm",
      "description_ar": "نخلة بسيطة تزين المعسكر.",
      "description_en": "Simple palm for decoration.",
      "rarity": "rare",
      "priceDinar": 30,
      "givesPoints": 15,
      "stock": 10,
      "maxPerUser": 2,
      "icon": "date_palm_plain"
    },
    {
      "key": "majlis_tent",
      "title_ar": "خيمة مجلس",
      "title_en": "Majlis Tent",
      "description_ar": "خيمة استقبال بضيافة عربية.",
      "description_en": "Majlis tent with Arabic hospitality.",
      "rarity": "barter",
      "priceDinar": 95,
      "givesPoints": 0,
      "stock": 3,
      "maxPerUser": 1,
      "icon": "majlis_tent"
    },
    {
      "key": "ramadan_lantern",
      "title_ar": "فانوس ذهبي",
      "title_en": "Golden Lantern",
      "description_ar": "فانوس مضيء يزين القافلة.",
      "description_en": "Shining lantern for the caravan.",
      "rarity": "rare",
      "priceDinar": 28,
      "givesPoints": 14,
      "stock": 18,
      "maxPerUser": 3,
      "icon": "ramadan_lantern"
    },
    {
      "key": "shemagh_red",
      "title_ar": "شماغ أحمر",
      "title_en": "Red Shemagh",
      "description_ar": "غطاء رأس تقليدي.",
      "description_en": "Traditional red shemagh.",
      "rarity": "common",
      "priceDinar": 12,
      "givesPoints": 5,
      "stock": 30,
      "maxPerUser": 3,
      "icon": "shemagh_red"
    },
    {
      "key": "golden_key",
      "title_ar": "مفتاح ذهبي",
      "title_en": "Golden Key",
      "description_ar": "يُشاع أنه يفتح صناديق خاصة.",
      "description_en": "Rumored to open special chests.",
      "rarity": "barter",
      "priceDinar": 70,
      "givesPoints": 0,
      "stock": 5,
      "maxPerUser": 1,
      "icon": "golden_key"
    },
    {
      "key": "coffee_cup",
      "title_ar": "فنجان قهوة",
      "title_en": "Coffee Cup",
      "description_ar": "فنجان قهوة عربية.",
      "description_en": "Cup of Arabic coffee.",
      "rarity": "common",
      "priceDinar": 4,
      "givesPoints": 2,
      "stock": 50,
      "maxPerUser": 6,
      "icon": "coffee_cup"
    },
    {
      "key": "silver_incense_burner",
      "title_ar": "مجمرة فضية",
      "title_en": "Silver Incense Burner",
      "description_ar": "مجمرة أنيقة لحرق البخور.",
      "description_en": "Elegant silver incense burner.",
      "rarity": "rare",
      "priceDinar": 26,
      "givesPoints": 13,
      "stock": 16,
      "maxPerUser": 2,
      "icon": "silver_incense_burner"
    },
    {
      "key": "golden_coffee_pot",
      "title_ar": "دلة قهوة فضية",
      "title_en": "Silver Coffee Pot",
      "description_ar": "دلة تقدم القهوة العربية الأصيلة.",
      "description_en": "Coffee pot for traditional Arabic coffee.",
      "rarity": "rare",
      "priceDinar": 30,
      "givesPoints": 15,
      "stock": 14,
      "maxPerUser": 2,
      "icon": "golden_coffee_pot"
    },
    {
      "key": "prayer_beads",
      "title_ar": "سبحة حمراء",
      "title_en": "Red Prayer Beads",
      "description_ar": "سبحة تقليدية.",
      "description_en": "Traditional prayer beads.",
      "rarity": "common",
      "priceDinar": 9,
      "givesPoints": 4,
      "stock": 30,
      "maxPerUser": 4,
      "icon": "prayer_beads"
    },
    {
      "key": "incense_burner_blue",
      "title_ar": "مبخرة زرقاء",
      "title_en": "Blue Incense Burner",
      "description_ar": "مبخرة معدنية بزخرفة بسيطة.",
      "description_en": "Metal incense burner with simple design.",
      "rarity": "common",
      "priceDinar": 12,
      "givesPoints": 5,
      "stock": 26,
      "maxPerUser": 3,
      "icon": "incense_burner_blue"
    },
    {
      "key": "incense_burner_gold",
      "title_ar": "مبخرة ذهبية",
      "title_en": "Golden Incense Burner",
      "description_ar": "مبخرة فاخرة مزينة بالأحجار.",
      "description_en": "Luxurious golden incense burner.",
      "rarity": "rare",
      "priceDinar": 32,
      "givesPoints": 16,
      "stock": 16,
      "maxPerUser": 2,
      "icon": "incense_burner_gold"
    },
    {
      "key": "incense_burner_round",
      "title_ar": "مجمرة مستديرة",
      "title_en": "Round Incense Censer",
      "description_ar": "مجمرة دائرية تقليدية.",
      "description_en": "Round traditional censer.",
      "rarity": "rare",
      "priceDinar": 28,
      "givesPoints": 14,
      "stock": 14,
      "maxPerUser": 2,
      "icon": "incense_burner_round"
    },
    {
      "key": "dates_box_golden",
      "title_ar": "صندوق تمر فاخر",
      "title_en": "Premium Dates Box",
      "description_ar": "تمر فاخر في صندوق مزخرف.",
      "description_en": "Premium dates in ornate box.",
      "rarity": "barter",
      "priceDinar": 45,
      "givesPoints": 0,
      "stock": 10,
      "maxPerUser": 2,
      "icon": "dates_box_golden"
    },
    {
      "key": "holy_book",
      "title_ar": "كتاب مزخرف",
      "title_en": "Ornate Book",
      "description_ar": "كتاب قديم مذهب.",
      "description_en": "Old gilded book.",
      "rarity": "barter",
      "priceDinar": 70,
      "givesPoints": 0,
      "stock": 5,
      "maxPerUser": 1,
      "icon": "holy_book"
    },
    {
      "key": "desert_amulet",
      "title_ar": "تعويذة الصحراء",
      "title_en": "Desert Amulet",
      "description_ar": "تعويذة يعتقد أنها تجلب الحظ.",
      "description_en": "Amulet said to bring luck.",
      "rarity": "barter",
      "priceDinar": 85,
      "givesPoints": 0,
      "stock": 4,
      "maxPerUser": 1,
      "icon": "desert_amulet"
    },
    {
      "key": "desert_compass",
      "title_ar": "بوصلة الصحراء",
      "title_en": "Desert Compass",
      "description_ar": "بوصلة خاصة لتتبع القوافل.",
      "description_en": "Special compass for caravans.",
      "rarity": "barter",
      "priceDinar": 75,
      "givesPoints": 0,
      "stock": 4,
      "maxPerUser": 1,
      "icon": "desert_compass"
    },
    {
      "key": "watch_gold_simple",
      "title_ar": "ساعة ذهبية بسيطة",
      "title_en": "Simple Gold Watch",
      "description_ar": "ساعة أنيقة للتجار المبتدئين.",
      "description_en": "Elegant watch for new merchants.",
      "rarity": "rare",
      "priceDinar": 40,
      "givesPoints": 20,
      "stock": 10,
      "maxPerUser": 2,
      "icon": "watch_gold_simple"
    },
    {
      "key": "book_small_journal",
      "title_ar": "دفتر قافلة صغير",
      "title_en": "Caravan Journal",
      "description_ar": "دفتر ملاحظات رحلات القافلة.",
      "description_en": "Journal of caravan journeys.",
      "rarity": "barter",
      "priceDinar": 8,
      "givesPoints": 0,
      "stock": 30,
      "maxPerUser": 4,
      "icon": "book_small_journal"
    },
    {
      "key": "water_bucket",
      "title_ar": "دلو ماء",
      "title_en": "Water Bucket",
      "description_ar": "دلو لسحب الماء من البئر.",
      "description_en": "Bucket for drawing water.",
      "rarity": "barter",
      "priceDinar": 5,
      "givesPoints": 0,
      "stock": 35,
      "maxPerUser": 5,
      "icon": "water_bucket"
    },
    {
      "key": "wheat_bundle",
      "title_ar": "حزمة قمح",
      "title_en": "Wheat Bundle",
      "description_ar": "سنابل قمح جاهزة للطحن.",
      "description_en": "Wheat ready for milling.",
      "rarity": "barter",
      "priceDinar": 6,
      "givesPoints": 0,
      "stock": 40,
      "maxPerUser": 6,
      "icon": "wheat_bundle"
    },
    {
      "key": "building_stones",
      "title_ar": "حجارة بناء",
      "title_en": "Building Stones",
      "description_ar": "كتل حجرية للبناء.",
      "description_en": "Stone blocks for building.",
      "rarity": "barter",
      "priceDinar": 7,
      "givesPoints": 0,
      "stock": 40,
      "maxPerUser": 6,
      "icon": "building_stones"
    },
    {
      "key": "timber_bundle",
      "title_ar": "ألواح خشبية",
      "title_en": "Timber Planks",
      "description_ar": "ألواح خشب للبناء.",
      "description_en": "Timber planks for construction.",
      "rarity": "barter",
      "priceDinar": 8,
      "givesPoints": 0,
      "stock": 36,
      "maxPerUser": 5,
      "icon": "timber_bundle"
    },
    {
      "key": "spice_mix_box",
      "title_ar": "علبة بهارات مشكلة",
      "title_en": "Mixed Spice Box",
      "description_ar": "بهارات متنوعة للطبخ.",
      "description_en": "Mixed spices for cooking.",
      "rarity": "rare",
      "priceDinar": 20,
      "givesPoints": 10,
      "stock": 18,
      "maxPerUser": 3,
      "icon": "spice_mix_box"
    },
    {
      "key": "sugar_sack",
      "title_ar": "كيس سكر",
      "title_en": "Sugar Sack",
      "description_ar": "سكر أبيض ناعم.",
      "description_en": "Fine white sugar.",
      "rarity": "barter",
      "priceDinar": 6,
      "givesPoints": 0,
      "stock": 40,
      "maxPerUser": 6,
      "icon": "sugar_sack"
    },
    {
      "key": "luxury_sweets_box",
      "title_ar": "علبة حلويات فاخرة",
      "title_en": "Luxury Sweets Box",
      "description_ar": "حلويات شرقية فاخرة.",
      "description_en": "Luxurious oriental sweets.",
      "rarity": "barter",
      "priceDinar": 55,
      "givesPoints": 0,
      "stock": 8,
      "maxPerUser": 2,
      "icon": "luxury_sweets_box"
    },
    {
      "key": "caravan_ticket",
      "title_ar": "تذكرة قافلة",
      "title_en": "Caravan Ticket",
      "description_ar": "تذكرة عبور خاصة.",
      "description_en": "Special caravan pass.",
      "rarity": "barter",
      "priceDinar": 0,
      "givesPoints": 0,
      "stock": 999,
      "maxPerUser": null,
      "icon": "caravan_ticket"
    },
    {
      "key": "rare_map_scroll",
      "title_ar": "لفة خريطة نادرة",
      "title_en": "Rare Map Scroll",
      "description_ar": "خريطة تشير لمواقع كنوز.",
      "description_en": "Map pointing to hidden treasures.",
      "rarity": "barter",
      "priceDinar": 0,
      "givesPoints": 0,
      "stock": 999,
      "maxPerUser": null,
      "icon": "rare_map_scroll"
    },
    {
      "key": "desert_idol",
      "title_ar": "تمثال صحراوي قديم",
      "title_en": "Ancient Desert Idol",
      "description_ar": "قطعة أثرية نادرة.",
      "description_en": "Rare ancient desert relic.",
      "rarity": "barter",
      "priceDinar": 0,
      "givesPoints": 0,
      "stock": 999,
      "maxPerUser": null,
      "icon": "desert_idol"
    }
  ],


  "barterTypes": [
    {
      "key": "royal_perfume",
      "title_ar": "عطر ملكي",
      "title_en": "Royal Perfume",
      "rarity": "barter_result",
      "icon": "royal_perfume",
      "points": 40,
      "source": "recipe"
    },
    {
      "key": "attar_bottle",
      "title_ar": "قنينة دهن عود",
      "title_en": "Oud Attar Bottle",
      "rarity": "barter_result",
      "icon": "attar_bottle",
      "points": 36,
      "source": "recipe"
    },
    {
      "key": "desert_amulet",
      "title_ar": "تعويذة الصحراء",
      "title_en": "Desert Amulet",
      "rarity": "barter_result",
      "icon": "desert_amulet",
      "points": 50,
      "source": "recipe"
    },
    {
      "key": "desert_compass",
      "title_ar": "بوصلة الصحراء",
      "title_en": "Desert Compass",
      "rarity": "barter_result",
      "icon": "desert_compass",
      "points": 45,
      "source": "recipe"
    },
    {
      "key": "treasure_chest_legendary",
      "title_ar": "صندوق كنز أسطوري",
      "title_en": "Legendary Treasure Chest",
      "rarity": "barter_result",
      "icon": "treasure_chest_legendary",
      "points": 140,
      "source": "recipe"
    },
    {
      "key": "date_palm_gold",
      "title_ar": "نخلة تمور ذهبية",
      "title_en": "Golden Date Palm",
      "rarity": "barter_result",
      "icon": "date_palm_gold",
      "points": 120,
      "source": "recipe"
    },
    {
      "key": "desert_horse_black",
      "title_ar": "حصان عربي أسود",
      "title_en": "Black Arabian Stallion",
      "rarity": "barter_result",
      "icon": "desert_horse_black",
      "points": 150,
      "source": "recipe"
    },
    {
      "key": "luxury_sweets_box",
      "title_ar": "علبة حلويات فاخرة",
      "title_en": "Luxury Sweets Box",
      "rarity": "barter_result",
      "icon": "luxury_sweets_box",
      "points": 36,
      "source": "recipe"
    },
    {
      "key": "dates_box_golden",
      "title_ar": "صندوق تمر فاخر",
      "title_en": "Premium Dates Box",
      "rarity": "barter_result",
      "icon": "dates_box_golden",
      "points": 32,
      "source": "recipe"
    },
    {
      "key": "holy_book",
      "title_ar": "كتاب مزخرف",
      "title_en": "Ornate Book",
      "rarity": "barter_result",
      "icon": "holy_book",
      "points": 44,
      "source": "fallback"
    },
    {
      "key": "desert_idol",
      "title_ar": "تمثال صحراوي قديم",
      "title_en": "Ancient Desert Idol",
      "rarity": "barter_result",
      "icon": "desert_idol",
      "points": 90,
      "source": "fallback"
    },
    {
      "key": "caravan_ticket",
      "title_ar": "تذكرة قافلة",
      "title_en": "Caravan Ticket",
      "rarity": "barter_result",
      "icon": "caravan_ticket",
      "points": 18,
      "source": "fallback"
    }
  ],


  "recipes": [
    {
      "inputs": ["honey_jar", "nuts_sack"],
      "outputKey": "luxury_sweets_box"
    },
    {
      "inputs": ["dates_box_golden", "spice_chest"],
      "outputKey": "royal_perfume"
    },
    {
      "inputs": ["incense_burner_gold", "spice_mix_box"],
      "outputKey": "attar_bottle"
    },
    {
      "inputs": ["blue_gem", "desert_compass"],
      "outputKey": "treasure_chest_legendary"
    },
    {
      "inputs": ["watch_gold_simple", "gold_card"],
      "outputKey": "golden_watch"
    },
    {
      "inputs": ["fruit_basket", "dates_box_golden"],
      "outputKey": "date_palm_gold"
    },
    {
      "inputs": ["seed_sack", "wheat_bundle"],
      "outputKey": "fine_flour_sack"
    },
    {
      "inputs": ["holy_book", "desert_amulet"],
      "outputKey": "desert_idol"
    },
    {
      "inputs": ["rare_map_scroll", "desert_compass"],
      "outputKey": "caravan_ticket"
    },
    {
      "inputs": ["majlis_tent", "ramadan_lantern"],
      "outputKey": "village_well"
    }
  ],
  
  "fallbacks": {
    "legendary+rare": "treasure_chest_legendary",
    "legendary+epic": "desert_idol",
    "epic+epic": "desert_amulet",
    "rare+rare": "luxury_sweets_box"
  }
};

export const barterTypeLookup = new Map(
  caravanContent.barterTypes.map((bt) => [bt.key, bt])
);
