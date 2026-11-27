import { validateList } from "../validation";

jest.mock("../unit", () => ({
  getUnitName: ({ unit }) => unit.name || unit.name_en || unit.id,
  getUnitLeadership: () => 0,
  getStackableMaximum: jest.requireActual("../unit").getStackableMaximum,
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

describe("validateList limitedByUnitsWithout options", () => {
  let unitCount = 0;
  const boyz = (type, strength, bigUns) => ({
    id: `${type}.${unitCount++}`,
    name_en: type,
    name: `Custom name ${unitCount}`,
    strength,
    options: [
      { name_en: "Big 'Uns", active: bigUns, limitedByUnitsWithout: true },
    ],
  });
  const getList = (core) => ({
    game: 'warhammer-fantasy-6th',
    army: 'orcs-and-goblins',
    points: 2000,
    characters: [],
    lords: [],
    heroes: [],
    core,
    special: [],
    rare: [],
    mercenaries: [],
    allies: [],
  });
  const getBigUnsErrors = (core) =>
    validateList({ list: getList(core), language: 'en', intl: { formatMessage: (o) => o.id } })
      .filter((e) => e.message === 'misc.error.tooManyModelsWithOption');

  test("the same models with and without the option give no error", () => {
    expect(getBigUnsErrors([boyz('orc-boyz', 10, true), boyz('orc-boyz', 10, false)])).toEqual([]);
  });

  test("models without the option can be split in several units", () => {
    const core = [boyz('orc-boyz', 20, true), boyz('orc-boyz', 10, false), boyz('orc-boyz', 10, false)];

    expect(getBigUnsErrors(core)).toEqual([]);
  });

  test("more models with the option give an error", () => {
    expect(getBigUnsErrors([boyz('orc-boyz', 20, true), boyz('orc-boyz', 10, false)])).toEqual([
      { message: 'misc.error.tooManyModelsWithOption', section: 'global', option: "Big 'Uns", name: 'orc-boyz', count: 20, max: 10 },
    ]);
  });

  test("models of another unit type don't count", () => {
    expect(getBigUnsErrors([boyz('orc-boyz', 10, true), boyz('savage-orc-boyz', 10, false)])).toEqual([
      { message: 'misc.error.tooManyModelsWithOption', section: 'global', option: "Big 'Uns", name: 'orc-boyz', count: 10, max: 0 },
    ]);
  });

  test("units without the option selected give no error", () => {
    expect(getBigUnsErrors([boyz('orc-boyz', 10, false), boyz('savage-orc-boyz', 20, false)])).toEqual([]);
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
  const getRequiresUnitsErrors = (knightsCount, yeomenCount) =>
    validateList({
      list: {
        game: 'warhammer-fantasy-mdn',
        army: 'bretonnia-mdn',
        armyComposition: 'bretonnia-mdn',
        points: 2000,
        characters: [],
        lords: [],
        heroes: [],
        core: [...units('mounted-knights-of-the-realm', knightsCount), ...units('yeomen', yeomenCount)],
        special: [],
        rare: [],
        mercenaries: [],
        allies: [],
      },
      language: 'en',
      intl: { formatMessage: (o) => o.id },
    }).filter((e) => e.message === 'misc.error.requiresUnits');

  test("as many Yeomen as Knights give no error", () => {
    expect(getRequiresUnitsErrors(1, 1)).toEqual([]);
  });

  test("Knights without Yeomen give no error", () => {
    expect(getRequiresUnitsErrors(2, 0)).toEqual([]);
  });

  test("more Yeomen than Knights give an error", () => {
    expect(getRequiresUnitsErrors(1, 2)).toEqual([
      { message: 'misc.error.requiresUnits', section: 'core', name: 'mounted-knights-of-the-realm', diff: 1 },
    ]);
  });

  test("Yeomen without Knights give an error", () => {
    expect(getRequiresUnitsErrors(0, 1)).toEqual([
      { message: 'misc.error.requiresUnits', section: 'core', name: 'mounted-knights-of-the-realm', diff: 1 },
    ]);
  });
});

describe("validateList stackable options limited by models", () => {
  const slayers = (giantSlayers) => ({
    id: 'slayers.0',
    name_en: 'Slayers',
    strength: 10,
    command: [{ name_en: 'Standard Bearer', active: true }],
    options: [
      { name_en: 'Giant Slayer', stackable: true, maximum: 30, maxByModels: true, stackableCount: giantSlayers },
    ],
  });
  const getStackableErrors = (giantSlayers) =>
    validateList({
      list: {
        game: 'warhammer-fantasy-6th',
        army: 'dwarfs',
        armyComposition: 'dwarfs',
        points: 2000,
        characters: [],
        lords: [],
        heroes: [],
        core: [],
        special: [slayers(giantSlayers)],
        rare: [],
        mercenaries: [],
        allies: [],
      },
      language: 'en',
      intl: { formatMessage: (o) => o.id },
    }).filter((e) => e.message === 'misc.error.tooManyStackable');

  test("more Giant Slayers than Slayers without command give an error", () => {
    expect(getStackableErrors(10)).toEqual([
      { message: 'misc.error.tooManyStackable', section: 'special', option: 'Giant Slayer', name: 'Slayers', max: 9 },
    ]);
  });

  test("as many Giant Slayers as Slayers without command give no error", () => {
    expect(getStackableErrors(9)).toEqual([]);
  });
});
