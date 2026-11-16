export const rules = {
  "grand-army": {
    lords: {
      maxPercent: 25,
      maxSlots: 1 },
    heroes: {
      maxPercent: 25,
      maxSlots: 4 },
    characters: {
      maxPercent: 50,
      maxSlots: 4 },
    core: {
      minPercent: 25,
      minSlots: 3},
    special: {
      maxPercent: 50,
      maxSlots: 4,
    },
    rare: {
      maxPercent: 25,
      maxSlots: 2,
    },
    mercenaries: { maxPercent: 20 },
    allies: { maxPercent: 25 },
  },
  // Warhammer Fantasy 6th edition
  // Slot limits are not set here: they scale with the army points (see `slotsByPoints`).
  // Use `minSlotsModifier`/`maxSlotsModifier` for armies with extra slots.
  "bretonnia": {
    characters: { maxSlotsModifier: 1 },
    lords: {
      units: [
        {
          ids: ["louen-leoncoeur", "the-fay-encahntress", "the-green-knight"],
        },
      ],
    },
    heroes: {
      maxSlotsModifier: 1,
      units: [
        {
          ids: ["paladin"],
          min: 1,
        },
      ],
    },
    core: {
      units: [
        {
          ids: ["mounted-knights-of-the-realm"],
          min: 1,
        },
      ],
    },
    special: {
      units: [
        {
          ids: ["battle-pilgrims"],
          max: 1,
          // max 1 only if: bretonnian-lord with grail-vow, OR paladin with grail-vow,
          // OR grail-knights in army, OR fay enchantress has grail-guardians attached
          requiresAny: [
            { type: "option", unit: "bretonnian-lord", id: "grail-vow" },
            { type: "option", unit: "paladin", id: "grail-vow" },
            { type: "unit", id: "grail-knights" },
            { type: "unit", id: "louen-leoncoeur" },
            { type: "attachedUnit", unit: "the-fay-encahntress", id: "grail-guardians" },
          ],
        },
        {
          ids: ["pegasus-knights"],
          max: 1,
          // No max limit if the General is a Bretonnian Lord mounted on a Royal Pegasus
          exceptIf: {
            general: true,
            unit: "bretonnian-lord",
            mount: "royal-pegasus",
          },
        },
      ],
    },
    rare: {
      units: [
        {
          ids: ["grail-knights"],
          max: 1,
        },
      ],
    },
  },
  "errantry-war": {
    characters: { maxSlotsModifier: 1 },
    heroes: {
      maxSlotsModifier: 1,
      units: [
        {
          ids: ["paladin"],
          min: 1,
        },
      ],
    },
    core: {
      units: [
        {
          ids: ["knights-errant"],
          min: 1,
        },
      ],
    },
    special: {
      units: [
        {
          ids: ["pegasus-knights"],
          max: 1,
          // No max limit if the General is a Bretonnian Lord mounted on a Royal Pegasus
          exceptIf: {
            general: true,
            unit: "bretonnian-lord",
            mount: "royal-pegasus",
          },
        },
      ],
    },
    rare: {
      units: [
        {
          ids: ["field-trebuchet"],
          max: 1,
        },
      ],
    },
  },
  "army-of-the-king": {
    characters: { maxSlotsModifier: 1 },
    lords: {
      units: [
        {
          ids: ["louen-leoncoeur"],
          min: 1,
          max: 1,
        },
        {
          ids: ["the-fay-encahntress", "the-green-knight"]
        },
      ],
    },
    heroes: {
      maxSlotsModifier: 1,
      units: [
        {
          ids: ["paladin"],
          min: 1,
        },
      ],
    },
    core: {
      units: [
        {
          ids: ["mounted-knights-of-the-realm"],
          min: 1,
        },
      ],
    },
    special: {
      units: [
        {
          ids: ["battle-pilgrims"],
          max: 1
        },
        {
          ids: ["pegasus-knights"],
          max: 1,
          // No max limit if the General is a Bretonnian Lord mounted on a Royal Pegasus
          exceptIf: {
            general: true,
            unit: "bretonnian-lord",
            mount: "royal-pegasus",
          },
        },
      ],
    },
  },
  "beasts-of-chaos": {},
  "chaos-dwarfs": {},
  "dark-elves": {},
  "dogs-of-war": {
    heroes: {
      units: [
        {
          ids: ["paymaster"],
          min: 1,
          max: 1,
        },
      ],
    },
    core: {
      units: [
        {
          ids: ["pirazzos-lost-legion"],
          max: 1,
        },
        {
          ids: ["riccos-republican-guard"],
          max: 1,
        },
        {
          ids: ["leopolds-leopard-company"],
          max: 1,
        },
        {
          ids: ["the-alcatani-fellowship"],
          max: 1,
        },
        {
          ids: ["vesperos-vendetta"],
          max: 1,
        },
        {
          ids: ["marksmen-of-miragliano"],
          max: 1,
        },
        {
          ids: ["al-muktars-desert-dogs"],
          max: 1,
        },
      ],
    },
    special: {
      units: [
        {
          ids: ["paymasters-bodyguard"],
          max: 1,
        },
      ],
    },
  },
  "dwarfs": {
    core: {
      units: [
        {
          ids: ["miners"],
          max: 1,
        },
        {
          ids: ["rangers"],
          max: 1,
        },
      ],
    },
    special: {
      units: [
        {
          ids: ["hammerers"],
          max: 1,
        },
        {
          ids: ["slayers"],
          max: 1,
        },
      ],
    },
  },
  "empire": {},
  "high-elves": {
    core: {
      units: [
        {
          ids: ["lothern-sea-guard"],
          max: 1,
        },
      ],
    },
    special: {
      units: [
        {
          ids: ["dragon-princes-of-caledor"],
          max: 1,
        },
        {
          ids: ["swordmasters-of-hoeth"],
          max: 1,
        },
      ],
    },
    rare: {
      units: [
        {
          ids: ["phoenix-guard"],
          max: 1,
        },
        {
          ids: ["white-lions"],
          max: 1,
        },
      ],
    },
  },
  "hordes-of-chaos": {},
  "lizardmen": {
    core: {
      units: [
        {
          ids: ["jungle-swarms"],
          max: 1,
        },
        {
          ids: ["temple-guard"],
          min: 0,
          max: 1,
          requiresType: "lords",
          requires: ["slann-mage-priest", "lord-kroak"],
          perUnit: true,
        },
      ],
    },
    special: {
      units: [
        {
          ids: ["chameleon-skinks"],
          max: 1,
        },
      ],
    },
  },
  "ogre-kingdoms": {},
  "orcs-and-goblins": {},
  "skaven": {},
  "tomb-kings": {},
  "vampire-counts": {
    characters: {},
    lords: { },
    heroes: {},
    core: {
      units: [
        {
          ids: ["bat-swarm"],
          max: 1,
        },
      ],
    },
    special: {},
    rare: {
      units: [
        {
          ids: ["black-coach"],
          max: 1,
        },
      ],
    },
  },
  "wood-elves": {},
  // Warhammer Fantasy MdN
  "bretonnia-mdn": {
    characters: {
      maxSlots: 5,
    },
    lords:{
      maxSlots: 1,
      units: [
        {
          ids: ["louen-leoncoeur", "the-fay-encahntress", "the-green-knight"],
        },
      ],
    },
    heroes: {
      maxSlots: 5,
      units: [
        {
          ids: ["paladin"],
          min: 1,
        },
      ],
    },
    core: {
      minSlots: 3,
      units: [
        {
          ids: ["mounted-knights-of-the-realm"],
          min: 1,
        },
        {
          ids: ["yeomen"],
          requires: ["mounted-knights-of-the-realm"],
          requiresType: "core",
          perUnit: true,
          min: 0,
          max: 1,
        },
      ],
    },
    special: {
      maxSlots: 4,
      units: [
        {
          ids: ["battle-pilgrims"],
          max: 1
        },
        {
          ids: ["pegasus-knights"],
          max: 1,
          // No max limit if the General is a Bretonnian Lord mounted on a Royal Pegasus
          exceptIf: {
            general: true,
            unit: "bretonnian-lord",
            mount: "royal-pegasus",
          },
        },
        {
          ids: ["arblastiers"],
          max: 1,
        },
        {
          ids: ["hunters"],
          max: 1,
        },
        {
          ids: ["yeomen"],
          max: 1,
        },
        {
          ids: ["brigands"],
          max: 1,
        },
      ],
    },
    rare: {
      maxSlots: 2,
      units: [
        {
          ids: ["grail-knights"],
          max: 1,
        },
        {
          ids: ["royal-pegasus"],
          requires: ["prophetess"],
          requiresType: "lords",
        },
        {
          ids: ["bretonnian-cannon"],
          // Cannot be selected if: bretonnian-lord with grail-vow, OR paladin with grail-vow,
          // OR grail-knights in army, OR louen, OR fay enchantress has grail-guardians attached
          forbiddenIf: [
            { type: "option", unit: "bretonnian-lord", id: "grail-vow" },
            { type: "option", unit: "paladin", id: "grail-vow" },
            { type: "unit", id: "grail-knights" },
            { type: "unit", id: "louen-leoncoeur" },
            { type: "attachedUnit", unit: "the-fay-encahntress", id: "grail-guardians" },
          ],
        },
      ],
    },
    mercenaries: { maxSlots: 0 },
    allies: {
      maxSlots: 0,
    },
  },
  "errantry-war-mdn": {
    characters: {
      maxSlots: 5,
    },
    lords:{
      maxSlots: 1,
    },
    heroes: {
      maxSlots: 5,
      units: [
        {
          ids: ["paladin"],
          min: 1,
        },
      ],
    },
    core: {
      minSlots: 3,
      units: [
        {
          ids: ["knights-errant"],
          min: 1,
        },
        {
          ids: ["yeomen"],
          requires: ["mounted-knights-of-the-realm"],
          requiresType: "core",
          perUnit: true,
          min: 0,
          max: 1,
        },
      ],
    },
    special: {
      maxSlots: 4,
      units: [
        {
          ids: ["pegasus-knights"],
          max: 1,
          // No max limit if the General is a Bretonnian Lord mounted on a Royal Pegasus
          exceptIf: {
            general: true,
            unit: "bretonnian-lord",
            mount: "royal-pegasus",
          },
        },
      ],
    },
    rare: {
      maxSlots: 2,
      units: [
        {
          ids: ["field-trebuchet"],
          max: 1,
        },
        {
          ids: ["bretonnian-cannon"],
          max: 1,
          // Cannot be selected if: bretonnian-lord with grail-vow, OR paladin with grail-vow,
          // OR grail-knights in army, OR louen, OR fay enchantress has grail-guardians attached
          forbiddenIf: [
            { type: "option", unit: "bretonnian-lord", id: "grail-vow" },
            { type: "option", unit: "paladin", id: "grail-vow" },
            { type: "unit", id: "grail-knights" },
            { type: "unit", id: "louen-leoncoeur" },
            { type: "attachedUnit", unit: "the-fay-encahntress", id: "grail-guardians" },
          ],
        },
      ],
    },
    mercenaries: { maxSlots: 0 },
    allies: {
      maxSlots: 0,
    },
  },
  "army-of-the-king-mdn": {
    characters: {
      maxSlots: 5,
    },
    lords:{
      maxSlots: 1,
      units: [
        {
          ids: ["louen-leoncoeur"],
          min: 1,
          max: 1,
        },
        {
          ids: ["the-fay-encahntress", "the-green-knight"]
        },
      ],
    },
    heroes: {
      maxSlots: 5,
      units: [
        {
          ids: ["paladin"],
          min: 1,
        },
      ],
    },
    core: {
      minSlots: 3,
      units: [
        {
          ids: ["mounted-knights-of-the-realm"],
          min: 1,
        },
        {
          ids: ["yeomen"],
          requires: ["mounted-knights-of-the-realm"],
          requiresType: "core",
          perUnit: true,
          min: 0,
          max: 1,
        },
      ],
    },
    special: {
      maxSlots: 4,
      units: [
        {
          ids: ["battle-pilgrims"],
          max: 1
        },
        {
          ids: ["pegasus-knights"],
          max: 1,
          // No max limit if the General is a Bretonnian Lord mounted on a Royal Pegasus
          exceptIf: {
            general: true,
            unit: "bretonnian-lord",
            mount: "royal-pegasus",
          },
        },
      ],
    },
    rare: {
      maxSlots: 2,
    },
    mercenaries: { maxSlots: 0 },
    allies: {
      maxSlots: 0,
    },
  },
};

export const getMaxPercentData = ({
  type,
  armyPoints,
  points,
  armyComposition,
}) => {
  const categoryData = rules[armyComposition]
    ? rules[armyComposition][type]
    : rules["grand-army"][type];

  if (!categoryData) {
    return null;
  }

  const maxPercent = categoryData.maxPercent;
  const maxPoints = Math.floor((armyPoints / 100) * maxPercent);

  return {
    points: maxPoints,
    overLimit: points > maxPoints,
    diff: points > maxPoints ? Math.ceil(points - maxPoints) : 0,
  };
};

// Slot limits that scale with the army points, per game system.
// `below2000` applies under 2000 pts, `base` from 2000 to 2999 pts,
// and each further full 1000 pts adds `per1000`. A plain number is a fixed limit.
export const slotsByPoints = {
  "warhammer-fantasy-6th": {
    characters: { maxSlots: { below2000: 3, base: 4, per1000: 2 } },
    lords: { maxSlots: { below2000: 0, base: 1, per1000: 1 } },
    heroes: { maxSlots: { below2000: 3, base: 4, per1000: 2 } },
    core: { minSlots: { below2000: 2, base: 3, per1000: 1 } },
    special: { maxSlots: { below2000: 3, base: 4, per1000: 1 } },
    rare: { maxSlots: { below2000: 1, base: 2, per1000: 1 } },
    mercenaries: { maxSlots: 0 },
    allies: { maxSlots: 0 },
  },
};

const scaleSlots = (scale, armyPoints) => {
  if (typeof scale === "number") {
    return scale;
  }

  const points = Number(armyPoints) || 0;

  if (points < 2000) {
    return scale.below2000;
  }

  return scale.base + Math.floor((points - 2000) / 1000) * scale.per1000;
};

// Resolves `minSlots` or `maxSlots` (`key`) for a category.
// An explicit value in `rules` wins; otherwise it is calculated from `slotsByPoints`
// plus the optional `minSlotsModifier`/`maxSlotsModifier` of the army composition.
const resolveSlots = ({ game, type, armyComposition, armyPoints, key }) => {
  const gameSlots = slotsByPoints[game];
  const compositionRules =
    rules[armyComposition] || (gameSlots ? {} : rules["grand-army"]);
  const categoryRules = compositionRules[type] || {};

  if (categoryRules[key] !== undefined) {
    return categoryRules[key];
  }

  const scale = gameSlots?.[type]?.[key];

  if (scale === undefined) {
    return undefined;
  }

  return scaleSlots(scale, armyPoints) + (categoryRules[`${key}Modifier`] || 0);
};

export const getMinSlots = ({
                              type,
                              armyPoints,
                              slots,
                              armyComposition,
                              game,
                            }) => {
  const minSlots = resolveSlots({ game, type, armyComposition, armyPoints, key: "minSlots" });

  return {
    points: Math.floor(armyPoints),
    overLimit: slots < minSlots,
    diff: slots < minSlots ? Math.ceil(minSlots - slots) : 0,
    slots: slots,
    minSlots: minSlots
  };
};

export const getMaxSlots = ({
                              type,
                              armyPoints,
                              slots,
                              armyComposition,
                              game,
                            }) => {
  const maxSlots = resolveSlots({ game, type, armyComposition, armyPoints, key: "maxSlots" });

  return {
    points: Math.floor(armyPoints),
    overLimit: slots > maxSlots,
    diff: slots > maxSlots ? Math.ceil(slots - maxSlots) : 0,
    slots: slots,
    maxSlots: maxSlots
  };
};

// Counts how many units from OTHER category lists (lords, heroes, core, etc.)
// have `extra_categories` containing the given `category` for the active `armyComposition`.
// For example: if Louen has extra_categories: ["heroes"] in "army-of-the-king",
// calling countExtraCategories(list, "heroes", "army-of-the-king") returns 1
// (because Louen is in list.lords but also counts as a heroes slot).
// The active mount's `extra_categories` are added too (e.g. a Zombie Dragon
// takes an extra heroes slot for its rider).
export const countExtraCategories = (list, category, armyComposition) => {
  if (!list || !category) return 0;
  const allTypes = ["lords", "heroes", "characters", "core", "special", "rare", "mercenaries", "allies"];
  // Count each occurrence of category in the array (supports repeated entries)
  const countCategory = (categories) =>
    Array.isArray(categories) ? categories.filter((c) => c === category).length : 0;
  let count = 0;
  for (const type of allTypes) {
    if (!Array.isArray(list[type])) continue;
    for (const unit of list[type]) {
      if (!unit) continue;
      // Check armyComposition-specific extra_categories first
      const acData = armyComposition && unit.armyComposition && unit.armyComposition[armyComposition];
      if (acData && Array.isArray(acData.extra_categories)) {
        count += countCategory(acData.extra_categories);
      } else {
        // Fallback: global extra_categories on the unit
        count += countCategory(unit.extra_categories);
      }
      const activeMount = (unit.mounts || []).find((mount) => mount.active);
      count += countCategory(activeMount?.extra_categories);
    }
  }
  return count;
};

// Nueva función: cuenta las unidades de tipo 'core' en una lista
// Excluye las unidades que tienen `no_count_slot: true` en su objeto.
// También respeta `unit.armyComposition[armyComposition].no_count_slot` si se pasa `armyComposition`.
// Parámetros:
// - list: objeto de lista que contiene la propiedad `core` (array de unidades)
// - options.useStrength: si true suma la propiedad `strength` de cada unidad (por defecto cuenta unidades)
// - options.armyComposition: id de la composición para comprobar overrides específicos

// Deprecate
export const countCoreUnits = (list, { useStrength = false, armyComposition = null } = {}) => {
  if (!list || !Array.isArray(list.core)) return 0;

  const countedUnits = list.core.filter((u) => {
    // defensiva: aceptar que u puede ser nulo/indefinido
    if (!u) return false;

    // Global no_count_slot on unit
    if (u.no_count_slot === true) return false;

    // Override per armyComposition (p. ej. unit.armyComposition['errantry-war-mdn'] = { no_count_slot: true })
    if (
      armyComposition &&
      u.armyComposition &&
      u.armyComposition[armyComposition] &&
      u.armyComposition[armyComposition].no_count_slot === true
    ) {
      return false;
    }

    return true;
  });

  if (useStrength) {
    return countedUnits.reduce((acc, u) => acc + (Number(u.strength) || 1), 0);
  }

  return countedUnits.length;
};

