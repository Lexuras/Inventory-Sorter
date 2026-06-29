const CATEGORY_RULES = [
  {
    rank: 0,
    patterns: [
      /(_log|_wood|_planks|_stone|_bricks?|_concrete|_terracotta|_glass|_wool|_slab|_stairs|_wall|_fence|_door|_trapdoor|_block)$/,
      /(dirt|grass_block|sand|gravel|netherrack|end_stone|obsidian|deepslate|cobblestone)/
    ]
  },
  {
    rank: 1,
    patterns: [
      /(coal|charcoal|iron_|gold_|copper_|diamond|emerald|lapis|redstone|netherite|quartz|amethyst)/,
      /(_ore|_ingot|_nugget|_raw|_gem|_dust)$/
    ]
  },
  {
    rank: 2,
    patterns: [/(pickaxe|axe|shovel|hoe|shears|fishing_rod|brush|flint_and_steel|compass|clock|bucket)/]
  },
  {
    rank: 3,
    patterns: [/(sword|bow|crossbow|trident|mace|arrow|shield|fire_charge)/]
  },
  {
    rank: 4,
    patterns: [/(helmet|chestplate|leggings|boots|elytra|horse_armor)/]
  },
  {
    rank: 5,
    patterns: [/(apple|bread|beef|porkchop|chicken|mutton|rabbit|cod|salmon|potato|carrot|beetroot|melon|cookie|cake|stew|soup|pie|berries|kelp|food)/]
  },
  {
    rank: 6,
    patterns: [/(redstone|repeater|comparator|piston|observer|hopper|dispenser|dropper|lever|button|pressure_plate|daylight_detector|target|tripwire)/]
  }
];

export function sortStacks(stacks) {
  return [...stacks].sort((left, right) => {
    const leftRank = categoryRank(left.item.typeId);
    const rightRank = categoryRank(right.item.typeId);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const typeCompare = left.item.typeId.localeCompare(right.item.typeId);
    if (typeCompare !== 0) {
      return typeCompare;
    }

    return left.firstSlot - right.firstSlot;
  });
}

function categoryRank(typeId) {
  const normalized = typeId.replace(/^minecraft:/, "");
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.rank;
    }
  }

  return 7;
}
