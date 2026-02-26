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

