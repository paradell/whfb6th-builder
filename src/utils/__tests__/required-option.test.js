import {
  unitHasOption,
  hasRequiredOption,
  getRequiredOptionCleanup,
  getAllOptions,
  isGroupLocked,
} from "../unit";
import { getUnitPoints } from "../points";

const vampire = (bloodline) => ({
  points: 100,
  options: [
    {
      name_en: "Bloodline",
      id: 0,
      points: 0,
      active: true,
      alwaysActive: true,
      options: [
        { name_en: "Von Carstein", id: "von-carstein", points: 0, exclusive: true, active: bloodline === "von-carstein" },
        { name_en: "Blood Dragon", id: "blood-dragon", points: 0, exclusive: true, active: bloodline === "blood-dragon" },
        { name_en: "Strigoi", id: "strigoi", points: 0, exclusive: true, active: bloodline === "strigoi" },
      ],
    },
    { name_en: "Shield", id: 1, points: 6, active: true, requiredOption: ["blood-dragon"] },
  ],
  melee: [
    { name_en: "Hand weapon", id: 0, points: 0, active: true, equippedDefault: true },
    { name_en: "Great weapon", id: 1, points: 6, active: true, requiredOption: ["von-carstein", "blood-dragon"] },
  ],
  armor: [
    { name_en: "Full plate armour", id: 0, points: 0, alwaysActive: true, requiredOption: ["blood-dragon"] },
  ],
  mounts: [
    { name_en: "On foot", id: "on-foot", points: 0, exclusive: true },
    { name_en: "Nightmare", id: "nightmare", points: 12, active: true, exclusive: true, requiredOption: ["von-carstein", "blood-dragon"], options: [{ name_en: "Barding", points: 6, active: true }] },
  ],
  items: [
    { name_en: "Von Carstein", requiredOption: ["von-carstein"], selected: [{ name_en: "Frostblade", points: 100 }] },
    { name_en: "Strigoi", requiredOption: "strigoi", selected: [] },
  ],
});

describe("unitHasOption", () => {
  test("finds active sub-options by id", () => {
    expect(unitHasOption(vampire("strigoi"), "strigoi")).toBe(true);
    expect(unitHasOption(vampire("strigoi"), ["von-carstein", "blood-dragon"])).toBe(false);
  });

  test("entries without requiredOption are always available", () => {
    expect(hasRequiredOption(vampire("strigoi"), undefined)).toBe(true);
  });
});

describe("getUnitPoints with requiredOption", () => {
  test("counts entries whose required option is active", () => {
    // base 100 + great weapon 6 + nightmare 12 + barding 6 + Frostblade 100
    expect(getUnitPoints(vampire("von-carstein"), {})).toBe(224);
  });

  test("ignores entries whose required option is not active", () => {
    expect(getUnitPoints(vampire("strigoi"), {})).toBe(100);
  });
});

describe("getRequiredOptionCleanup", () => {
  test("deselects hidden entries and falls back to an available mount", () => {
    const cleanup = getRequiredOptionCleanup(vampire("strigoi"));

    expect(cleanup.melee.map(({ active }) => active)).toEqual([true, false]);
    expect(cleanup.options[1].active).toBe(false);
    expect(cleanup.mounts.map(({ active }) => active)).toEqual([true, false]);
    expect(cleanup.mounts[1].options[0].active).toBe(false);
    expect(cleanup.items[0].selected).toEqual([]);
  });

  test("activates always active entries that become available", () => {
    const cleanup = getRequiredOptionCleanup(vampire("blood-dragon"));

    expect(cleanup.armor[0].active).toBe(true);
    expect(cleanup.items[0].selected).toEqual([]);
    expect(cleanup.mounts[1].active).toBe(true);
  });
});

describe("getAllOptions with requiredOption", () => {
  test("only lists entries of the active bloodline", () => {
    const text = getAllOptions(vampire("strigoi"), { asString: true });

    expect(text).not.toMatch(/Great weapon|Nightmare|Frostblade|Shield/);
  });
});

describe("command magic with requiredOption", () => {
  const warriors = (longbeards) => ({
    points: 8,
    strength: 10,
    options: [
      { name_en: "Longbeards", id: "longbeards", points: 3, perModel: true, active: longbeards },
    ],
    command: [
      {
        name_en: "Standard Bearer",
        id: 0,
        points: 10,
        active: true,
        magic: {
          types: ["banner-runes"],
          maxPoints: 50,
          requiredOption: "longbeards",
          selected: [{ name_en: "Rune of Battle", points: 25 }],
        },
      },
      {
        name_en: "Musician",
        id: 1,
        points: 5,
        active: true,
        magic: { types: ["banner-runes"], selected: [{ name_en: "Rune of Sanctuary", points: 15 }] },
      },
    ],
  });

  test("counts the magic items when the required option is active", () => {
    // 10 models x (8 + 3) + standard 10 + Rune of Battle 25 + musician 5 + Rune of Sanctuary 15
    expect(getUnitPoints(warriors(true), {})).toBe(165);
  });

  test("ignores the magic items when the required option is not active", () => {
    // 10 models x 8 + standard 10 + musician 5 + Rune of Sanctuary 15
    expect(getUnitPoints(warriors(false), {})).toBe(110);
  });

  test("cleanup removes the magic items only when the required option is not active", () => {
    expect(getRequiredOptionCleanup(warriors(true)).command[0].magic.selected).toHaveLength(1);
    expect(getRequiredOptionCleanup(warriors(false)).command[0].magic.selected).toEqual([]);
    expect(getRequiredOptionCleanup(warriors(false)).command[1].magic.selected).toHaveLength(1);
  });

  test("only lists the magic items when the required option is active", () => {
    expect(getAllOptions(warriors(true), { asString: true })).toMatch(/Rune of Battle/);
    expect(getAllOptions(warriors(false), { asString: true })).not.toMatch(/Rune of Battle/);
  });
});

describe("mandatoryOption", () => {
  const rangers = (active) => ({
    points: 8,
    strength: 10,
    options: [
      { name_en: "Rangers", id: "rangers", points: 1, perModel: true, onePerArmy: true, active },
    ],
    melee: [
      { name_en: "Hand weapon", id: 0, points: 0, perModel: true, active: true, alwaysActive: true },
      { name_en: "Great weapon", id: 1, points: 2, perModel: true, mandatoryOption: "rangers" },
    ],
    ranged: [
      { name_en: "Crossbow", id: 0, points: 5, perModel: true, group: "missile" },
    ],
  });

  test("selects the mandatory entry instead of the rest of its group", () => {
    const unit = rangers(true);
    const cleanup = getRequiredOptionCleanup(unit);

    expect(cleanup.melee.map(({ active }) => active)).toEqual([false, true]);
    expect(isGroupLocked(unit, unit.melee, undefined)).toBe(true);
    // 10 models x (8 + rangers 1 + great weapon 2)
    expect(getUnitPoints({ ...unit, melee: cleanup.melee }, {})).toBe(110);
  });

  test("doesn't change anything while the option is not active", () => {
    const unit = rangers(false);

    expect(getRequiredOptionCleanup(unit).melee).toEqual(unit.melee);
    expect(isGroupLocked(unit, unit.melee, undefined)).toBe(false);
  });

  test("only locks the group of the mandatory entry", () => {
    const unit = rangers(true);

    expect(isGroupLocked(unit, unit.ranged, "missile")).toBe(false);
    expect(getRequiredOptionCleanup(unit).ranged).toEqual(unit.ranged);
  });
});
