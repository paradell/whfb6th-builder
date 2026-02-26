import { countCoreUnits } from "../rules";

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

