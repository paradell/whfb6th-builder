import {
  unitHasOption,
  hasRequiredOption,
  getRequiredOptionCleanup,
  getAllOptions,
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
