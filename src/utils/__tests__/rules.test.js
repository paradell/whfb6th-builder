import { countCoreUnits, countExtraCategories, getMinSlots, getMaxSlots } from "../rules";

describe("countExtraCategories", () => {
  const zombieDragon = (active) => ({ id: "zombie-dragon", active, extra_categories: ["heroes"] });
  const onFoot = (active) => ({ id: "on-foot", active });
  const vampireLord = (dragonActive) => ({
    id: "vampire-lord",
    armyComposition: { "vampire-counts": { category: "lords", extra_categories: ["heroes"] } },
    mounts: [onFoot(!dragonActive), zombieDragon(dragonActive)],
  });
  const masterNecromancer = (dragonActive) => ({
    id: "master-necromancer",
    armyComposition: { "vampire-counts": { category: "lords" } },
    mounts: [onFoot(!dragonActive), zombieDragon(dragonActive)],
  });

  test("an active mount adds its extra categories to the unit's own", () => {
    expect(countExtraCategories({ lords: [vampireLord(true)] }, "heroes", "vampire-counts")).toBe(2);
    expect(countExtraCategories({ lords: [masterNecromancer(true)] }, "heroes", "vampire-counts")).toBe(1);
    expect(countExtraCategories({ lords: [vampireLord(true)] }, "lords", "vampire-counts")).toBe(0);
  });

  test("inactive mounts don't add extra categories", () => {
    expect(countExtraCategories({ lords: [vampireLord(false)] }, "heroes", "vampire-counts")).toBe(1);
    expect(countExtraCategories({ lords: [masterNecromancer(false)] }, "heroes", "vampire-counts")).toBe(0);
  });
});

describe("countCoreUnits", () => {
  const baseUnit = (id, opts = {}) => ({ id, strength: opts.strength, no_count_slot: opts.no_count_slot, armyComposition: opts.armyComposition });

  test("counts units excluding global no_count_slot", () => {
    const list = { core: [baseUnit('a'), baseUnit('b', { no_count_slot: true }), baseUnit('c')] };

    expect(countCoreUnits(list)).toBe(2);
  });

  test("respects armyComposition override no_count_slot", () => {
    const list = { core: [
      baseUnit('a'),
      baseUnit('b', { armyComposition: { 'errantry-war-mdn': { no_count_slot: true } } }),
      baseUnit('c')
    ] };

    expect(countCoreUnits(list, { armyComposition: 'errantry-war-mdn' })).toBe(2);
    // If composition different, counts all
    expect(countCoreUnits(list, { armyComposition: 'bretonnia-mdn' })).toBe(3);
  });

  test("useStrength sums strength when requested", () => {
    const list = { core: [baseUnit('a', { strength: 2 }), baseUnit('b', { strength: 3 })] };
    expect(countCoreUnits(list, { useStrength: true })).toBe(5);
  });
});


describe("slot limits by army points", () => {
  const game = "warhammer-fantasy-6th";
  const minSlots = (type, armyPoints, armyComposition = "dwarfs") =>
    getMinSlots({ type, armyPoints, slots: 0, armyComposition, game }).minSlots;
  const maxSlots = (type, armyPoints, armyComposition = "dwarfs") =>
    getMaxSlots({ type, armyPoints, slots: 0, armyComposition, game }).maxSlots;

  test("core minimum grows by 1 every 1000 points from 2000", () => {
    expect(minSlots("core", 1999)).toBe(2);
    expect(minSlots("core", 2000)).toBe(3);
    expect(minSlots("core", 2999)).toBe(3);
    expect(minSlots("core", 3000)).toBe(4);
    expect(minSlots("core", 4500)).toBe(5);
  });

  test("characters, lords, heroes, special and rare maximums scale with points", () => {
    expect(maxSlots("characters", 1500)).toBe(3);
    expect(maxSlots("characters", 3000)).toBe(6);
    expect(maxSlots("heroes", 1500)).toBe(3);
    expect(maxSlots("heroes", 3000)).toBe(6);
    expect(maxSlots("lords", 1500)).toBe(0);
    expect(maxSlots("lords", 4000)).toBe(3);
    expect(maxSlots("special", 1500)).toBe(3);
    expect(maxSlots("special", 3000)).toBe(5);
    expect(maxSlots("rare", 1500)).toBe(1);
    expect(maxSlots("rare", 3000)).toBe(3);
    expect(maxSlots("mercenaries", 3000)).toBe(0);
  });

  test("army modifiers are added to the scaled value", () => {
    expect(maxSlots("heroes", 2000, "bretonnia")).toBe(5);
    expect(maxSlots("characters", 3000, "army-of-the-king")).toBe(7);
  });

  test("armies without rules entry still scale", () => {
    expect(minSlots("core", 3000, "unknown-army")).toBe(4);
  });

  test("explicit values in other game systems are kept", () => {
    expect(
      getMaxSlots({ type: "heroes", armyPoints: 3000, slots: 0, armyComposition: "bretonnia-mdn", game: "warhammer-fantasy-mdn" }).maxSlots
    ).toBe(5);
    expect(
      getMinSlots({ type: "core", armyPoints: 1000, slots: 0, armyComposition: "grand-army", game: "custom-system" }).minSlots
    ).toBe(3);
  });

  test("overLimit and diff at the boundaries", () => {
    const max = (slots) => getMaxSlots({ type: "rare", armyPoints: 2000, slots, armyComposition: "dwarfs", game });
    expect(max(2)).toMatchObject({ overLimit: false, diff: 0 });
    expect(max(3)).toMatchObject({ overLimit: true, diff: 1 });

    const min = (slots) => getMinSlots({ type: "core", armyPoints: 2000, slots, armyComposition: "dwarfs", game });
    expect(min(3)).toMatchObject({ overLimit: false, diff: 0 });
    expect(min(1)).toMatchObject({ overLimit: true, diff: 2 });
  });
});
