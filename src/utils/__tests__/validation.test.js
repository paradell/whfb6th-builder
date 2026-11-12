import { validateList } from "../validation";
import { getUnitRuleData } from "../unit";

jest.mock("../unit", () => ({
  getUnitRuleData: jest.fn(),
  getUnitName: ({ unit }) => unit.name_en || unit.id,
  getUnitLeadership: () => 0,
}));

describe("validateList integration with countCoreUnits", () => {
  beforeEach(() => {
    // make every unit pass filterByTroopType by returning a valid troopType
    getUnitRuleData.mockReturnValue({ troopType: 'MCa' });
  });

  test("the-old-world nonCharacters check excludes units with armyComposition no_count_slot", () => {
    const list = {
      game: 'the-old-world',
      points: 1000,
      compositionRule: null,
      armyComposition: 'bretonnia-mdn',
      characters: [],
      lords: [],
      heroes: [],
      core: [
        { id: 'u1', name_en: 'u1' },
        { id: 'u2', name_en: 'u2', armyComposition: { 'bretonnia-mdn': { no_count_slot: true } } },
      ],
      special: [],
      rare: [],
      mercenaries: [],
      allies: [],
    };

    const errors = validateList({ list, language: 'en', intl: { formatMessage: (o) => o.id } });

    // nonCharactersCount should be coreUnits (excluding the one with no_count_slot) -> 1
    // Since nonCharactersCount < 3, expect notEnoughNonCharacters in errors
    expect(errors.some(e => e.message === 'misc.error.notEnoughNonCharacters')).toBe(true);
  });
});


describe("validateList sameInArmy options", () => {
  beforeEach(() => {
    getUnitRuleData.mockReturnValue({ troopType: 'MCa' });
  });

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

describe("validateList character slots", () => {
  beforeEach(() => {
    getUnitRuleData.mockReturnValue({ troopType: 'MCa' });
  });

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
