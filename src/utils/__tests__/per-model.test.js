import { getAllOptions, getRemovedModelsCleanup } from "../unit";
import { getUnitPoints } from "../points";

const crewEngineer = (model, { active = false, handgun = false } = {}) => ({
  name_en: "Crew Engineer",
  id: model - 1,
  model,
  points: 15,
  active,
  options: [
    { name_en: "Dwarf Handgun", points: 5, active: handgun },
    { name_en: "Brace of pistols", points: 5 },
  ],
});
const runes = (model, selected = []) => ({
  name_en: "Engineering Runes",
  model,
  types: ["engineering-runes"],
  selected,
});
const boltThrowers = (strength) => ({
  points: 45,
  minimum: 1,
  maximum: 2,
  strength,
  command: [
    crewEngineer(1, { active: true, handgun: true }),
    crewEngineer(2, { active: true }),
  ],
  items: [
    runes(1, [{ name_en: "Rune of Burning", points: 5 }]),
    runes(2, [{ name_en: "Rune of Penetrating", points: 10 }]),
  ],
});

describe("units with per-model command and items", () => {
  test("counts the points of each model's entries", () => {
    // 2 x 45 + engineer 15 + handgun 5 + rune 5 + engineer 15 + rune 10
    expect(getUnitPoints(boltThrowers(2), {})).toBe(140);
  });

  test("groups each model's entries in the summary", () => {
    expect(getAllOptions(boltThrowers(2))).toBe(
      "#1 Crew Engineer [Dwarf Handgun] + Rune of Burning, #2 Crew Engineer + Rune of Penetrating",
    );
  });

  test("leaves the items out of the summary without magic items", () => {
    expect(getAllOptions(boltThrowers(2), { noMagic: true })).toBe(
      "#1 Crew Engineer [Dwarf Handgun], #2 Crew Engineer",
    );
  });
});

describe("getRemovedModelsCleanup", () => {
  test("clears the entries of the models above the unit size", () => {
    const cleanup = getRemovedModelsCleanup(boltThrowers(2), 1);

    expect(cleanup.command[0]).toEqual(boltThrowers(2).command[0]);
    expect(cleanup.command[1].active).toBe(false);
    expect(cleanup.command[1].options.map(({ active }) => active)).toEqual([false, false]);
    expect(cleanup.items[0].selected).toHaveLength(1);
    expect(cleanup.items[1].selected).toEqual([]);
    expect(getUnitPoints({ ...boltThrowers(1), ...cleanup }, {})).toBe(70);
  });

  test("keeps every entry while all models are in the unit", () => {
    const cleanup = getRemovedModelsCleanup(boltThrowers(2), 2);

    expect(cleanup.command).toEqual(boltThrowers(2).command);
    expect(cleanup.items).toEqual(boltThrowers(2).items);
  });
});
