import { validateList } from "../validation";

jest.mock("../unit", () => ({
  getUnitName: ({ unit }) => unit.name || unit.name_en || unit.id,
  getUnitLeadership: () => 0,
}));

describe("validateList sameInArmy options", () => {
  const vampire = (id, bloodline) => ({
    id,
    name_en: id,
    options: [
      {
        name_en: 'Bloodline',
        active: true,
        sameInArmy: true,
        options: ['Von Carstein', 'Lahmia'].map((name_en) => ({ name_en, active: name_en === bloodline })),
      },
    ],
  });
  const getList = (lords, heroes) => ({
    game: 'warhammer-fantasy-6th',
    army: 'vampire-counts',
    points: 2000,
    characters: [],
    lords,
    heroes,
    core: [],
    special: [],
    rare: [],
    mercenaries: [],
    allies: [],
  });
  const getBloodlineErrors = (list) =>
    validateList({ list, language: 'en', intl: { formatMessage: (o) => o.id } })
      .filter((e) => e.message === 'misc.error.sameOptionInArmy');

  test("vampires with different bloodlines give an error", () => {
    const errors = getBloodlineErrors(getList([vampire('lord', 'Von Carstein')], [vampire('thrall', 'Lahmia')]));

    expect(errors).toEqual([
      { message: 'misc.error.sameOptionInArmy', section: 'global', option: 'Bloodline', name: 'Von Carstein, Lahmia' },
    ]);
  });

  test("vampires with the same bloodline give no error", () => {
    const list = getList([vampire('lord', 'Lahmia')], [vampire('thrall', 'Lahmia'), vampire('thrall2', 'Lahmia')]);

    expect(getBloodlineErrors(list)).toEqual([]);
  });

  test("a single vampire gives no error", () => {
    expect(getBloodlineErrors(getList([vampire('lord', 'Lahmia')], []))).toEqual([]);
  });
});

describe("validateList onePerArmy options", () => {
  const runeLord = (id, anvilActive, subOptions) => ({
    id,
    name_en: id,
    options: [
      { name_en: 'Anvil of Doom', active: anvilActive, onePerArmy: true, options: subOptions },
      { name_en: 'Shield', active: true },
    ],
  });
  const getList = (lords) => ({
    game: 'warhammer-fantasy-6th',
    army: 'dwarfs',
    points: 2000,
    characters: [],
    lords,
    heroes: [],
    core: [],
    special: [],
    rare: [],
    mercenaries: [],
    allies: [],
  });
  const getOnePerArmyErrors = (list) =>
    validateList({ list, language: 'en', intl: { formatMessage: (o) => o.id } })
      .filter((e) => e.message === 'misc.error.optionOnePerArmy');

  test("the same option on two units gives an error", () => {
    const errors = getOnePerArmyErrors(getList([runeLord('rune-lord-1', true), runeLord('rune-lord-2', true)]));

    expect(errors).toEqual([
      { message: 'misc.error.optionOnePerArmy', section: 'global', option: 'Anvil of Doom', name: 'rune-lord-1, rune-lord-2' },
    ]);
  });

  test("an inactive option on the second unit gives no error", () => {
    const list = getList([runeLord('rune-lord-1', true), runeLord('rune-lord-2', false)]);

    expect(getOnePerArmyErrors(list)).toEqual([]);
  });

  test("a single unit gives no error", () => {
    expect(getOnePerArmyErrors(getList([runeLord('rune-lord-1', true)]))).toEqual([]);
  });

  test("the same sub-option on two units gives an error", () => {
    const subOptions = () => [{ name_en: 'Unique Upgrade', active: true, onePerArmy: true }];
    const lord = (id) => ({
      ...runeLord(id, false),
      options: [{ name_en: 'Upgrades', active: true, options: subOptions() }],
    });

    expect(getOnePerArmyErrors(getList([lord('rune-lord-1'), lord('rune-lord-2')]))).toEqual([
      { message: 'misc.error.optionOnePerArmy', section: 'global', option: 'Unique Upgrade', name: 'rune-lord-1, rune-lord-2' },
    ]);
  });
});

describe("validateList character slots", () => {
  const hero = (id) => ({ id, name_en: id });
  const getCharacterSlotErrors = (heroesCount) =>
    validateList({
      list: {
        game: 'warhammer-fantasy-6th',
        army: 'dwarfs',
        armyComposition: 'dwarfs',
        points: 3000,
        characters: [],
        lords: [],
        heroes: Array.from({ length: heroesCount }, (_, i) => hero(`hero-${i}`)),
        core: [],
        special: [],
        rare: [],
        mercenaries: [],
        allies: [],
      },
      language: 'en',
      intl: { formatMessage: (o) => o.id },
    }).filter((e) => e.message === 'misc.error.tooManyCharacterSlots');

  test("6 characters are allowed at 3000 points", () => {
    expect(getCharacterSlotErrors(6)).toHaveLength(0);
  });

  test("7 characters are too many at 3000 points", () => {
    expect(getCharacterSlotErrors(7)).toHaveLength(1);
  });
});

describe("validateList units limited per required unit", () => {
  const units = (id, count) =>
    Array.from({ length: count }, (_, i) => ({ id: `${id}.${i}`, name_en: id }));
  const getRequiresUnitsErrors = (warriorsCount, longbeardsCount, armyComposition = 'dwarfs') =>
    validateList({
      list: {
        game: 'warhammer-fantasy-6th',
        army: 'dwarfs',
        armyComposition,
        points: 2000,
        characters: [],
        lords: [],
        heroes: [],
        ...(armyComposition === 'dwarfs-2000'
          ? { core: units('warriors', warriorsCount), special: units('longbeards-2000', longbeardsCount) }
          : { core: [...units('warriors', warriorsCount), ...units('longbeards', longbeardsCount)], special: [] }),
        rare: [],
        mercenaries: [],
        allies: [],
      },
      language: 'en',
      intl: { formatMessage: (o) => o.id },
    }).filter((e) => e.message === 'misc.error.requiresUnits');

  test("as many Longbeards as Warriors give no error", () => {
    expect(getRequiresUnitsErrors(1, 1)).toEqual([]);
  });

  test("Warriors without Longbeards give no error", () => {
    expect(getRequiresUnitsErrors(2, 0)).toEqual([]);
  });

  test("more Longbeards than Warriors give an error", () => {
    expect(getRequiresUnitsErrors(1, 2)).toEqual([
      { message: 'misc.error.requiresUnits', section: 'core', name: 'warriors', diff: 1 },
    ]);
  });

  test("Longbeards without Warriors give an error", () => {
    expect(getRequiresUnitsErrors(0, 1)).toEqual([
      { message: 'misc.error.requiresUnits', section: 'core', name: 'warriors', diff: 1 },
    ]);
  });

  test("Special Longbeards of the 2000 book are not limited by Warriors", () => {
    expect(getRequiresUnitsErrors(0, 2, 'dwarfs-2000')).toEqual([]);
  });
});
