import {
  isMultipleAllowedItem,
  maxAllowedOfItem,
  itemsUsedElsewhere,
  combosUsedElsewhere
} from "./magic-item-limitations";
import magicItems from "../../public/games/warhammer-fantasy-6th/magic-items.json";

const findItem = (category, name) =>
  magicItems[category].find((item) => item.name_en === name);

describe("isMultipleAllowedItem", () => {
  test("Normally, you should not be able to have multiple of the same magic item.", () => {
    const item = findItem("general", "Sword of Striking");

    expect(isMultipleAllowedItem(item)).toBe(false);
  });

  test("You can have more than 1 dispel scroll per unit.", () => {
    const item = findItem("general", "Dispell Scroll");

    expect(isMultipleAllowedItem(item)).toBe(true);
  });

  test("Some Dwarf runes can be taken multiple times", () => {
    const item = findItem("weapon-runes", "Rune of Striking");

    expect(isMultipleAllowedItem(item)).toBe(true);
  });

  test("Master runes can only be taken once", () => {
    const item = findItem("weapon-runes", "Master Rune of Skalf Blackhammer");

    expect(isMultipleAllowedItem(item)).toBe(false);
  });
});

describe("maxAllowedOfItem", () => {
  test("If you have 100 points remaining, you can take 4 dispel scrolls.", () => {
    const item = findItem("general", "Dispell Scroll"); // 25 points

    expect(maxAllowedOfItem(item, 0, 100)).toBe(4);
  });

  test("If you have 30 points remaining and already have 2, you can have up to 3 dispel scrolls.", () => {
    const item = findItem("general", "Dispell Scroll"); // 25 points

    expect(maxAllowedOfItem(item, 2, 30)).toBe(3);
  });

  test("You can never have more than the maximum, even if enough points", () => {
    const item = { name_en: "Limited Item", points: 10, maximum: 3 };

    expect(maxAllowedOfItem(item, 0, 100)).toBe(3);
  });

  test("Items that cannot be stacked are limited to 1", () => {
    const item = findItem("general", "Sword of Striking");

    expect(maxAllowedOfItem(item, 0, 100)).toBe(1);
  });
});

const kingId = "king.grdbtm";
// List with a King and a Thane with no overlapping runes
const dwarfsList = {
  "name": "Dwarfs",
  "game": "warhammer-fantasy-6th",
  "army": "dwarfs",
  "characters": [],
  "lords": [
    {
      "name_en": "King",
      "id": kingId,
      "items": [
        {
          "name_en": "Runes",
          "types": ["weapon-runes", "armor-runes", "talismanic-runes"],
          "selected": [
            findItem("weapon-runes", "Rune of Striking"),
            findItem("weapon-runes", "Rune of Cleaving"),
            findItem("armor-runes", "Master Rune of Gromril"),
          ]
        }
      ]
    }
  ],
  "heroes": [
    {
      "name_en": "Thane",
      "id": "thane.gwrngoed",
      "items": [
        {
          "name_en": "Runes",
          "types": ["weapon-runes", "armor-runes", "talismanic-runes"],
          "selected": [
            findItem("weapon-runes", "Rune of Speed"),
          ]
        }
      ]
    }
  ],
  "core": [],
  "core_not_count": [],
  "special": [],
  "rare": [],
  "mercenaries": [],
  "allies": [],
  "id": "lcqmhc",
  "armyComposition": "dwarfs"
};

// Deep copy of the list. structuredClone() would do this cleaner, but it
// doesn't seem supported by whatever version of node is running tests here.
const getList = () => JSON.parse(JSON.stringify(dwarfsList));

describe("itemsUsedElsewhere", () => {
  test("No errors if no items are shared", () => {
    const list = getList();
    const items = list.lords[0].items[0].selected;

    expect(itemsUsedElsewhere(items, list, kingId)).toHaveLength(0);
  });

  test("Warns if a one per army item is used by a lord and a hero", () => {
    const list = getList();
    const items = list.lords[0].items[0].selected;

    list.heroes[0].items[0].selected.push(
      findItem("armor-runes", "Master Rune of Gromril")
    );

    expect(itemsUsedElsewhere(items, list, kingId)).toHaveLength(1);
  });

  test("Warns if a character's one per army item is used by command models", () => {
    const list = getList();
    const items = list.lords[0].items[0].selected;

    // Add a unit of Ironbreakers whose champion has the Master Rune of Gromril
    list.core.push(
      {
        "name_en": "Ironbreakers",
        "id": "ironbreakers.qjbtqm",
        "command": [
          {
            "name_en": "Ironbeard (champion)",
            "active": true,
            "magic": {
              "selected": [
                findItem("armor-runes", "Master Rune of Gromril")
              ]
            }
          }
        ]
      }
    );

    expect(itemsUsedElsewhere(items, list, kingId)).toHaveLength(1);
  });

  test("No error if an item can be used by more than one unit", () => {
    const list = getList();
    const items = list.lords[0].items[0].selected;

    list.heroes[0].items[0].selected.push(
      findItem("weapon-runes", "Rune of Striking")
    );

    expect(itemsUsedElsewhere(items, list, kingId)).toHaveLength(0);
  });
});

describe("combosUsedElsewhere", () => {
  test("No errors if no rune loadouts are shared", () => {
    const list = getList();
    const items = list.lords[0].items[0].selected;

    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(0);
  });

  test("Warns if a rune loadout is used by more than one character", () => {
    const list = getList();
    const items = list.lords[0].items[0].selected;
    const thaneRunes = list.heroes[0].items[0].selected;

    // Rune of Striking is shared with the King, but not a fully shared loadout
    thaneRunes[0] = findItem("weapon-runes", "Rune of Striking");
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(0);

    // Add a Rune of Cleaving, completing a shared loadout with the King
    thaneRunes.push(findItem("weapon-runes", "Rune of Cleaving"));
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(1);

    // Add a Rune of Speed, making the loadout different again
    thaneRunes.push(findItem("weapon-runes", "Rune of Speed"));
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(0);
  });

  test("Warns if a rune loadout is shared by a unit command model", () => {
    const list = getList();
    const items = list.lords[0].items[0].selected;

    // Add a Dwarf Warriors champion with Rune of Striking, which is shared with the King, but not a fully shared loadout
    list.core.push(
      {
        "name_en": "Dwarf Warriors",
        "id": "dwarf-warriors.yfnqemhtz",
        "command": [
          {
            "name_en": "Veteran (champion)",
            "magic": {
              "types": ["weapon-runes"],
              "selected": [
                findItem("weapon-runes", "Rune of Striking")
              ]
            },
            "id": 0,
            "active": true
          }
        ]
      }
    );
    const championRunes = list.core[0].command[0].magic.selected;
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(0);

    // Add a Rune of Cleaving to the champion, completing a shared loadout with the King
    championRunes.push(findItem("weapon-runes", "Rune of Cleaving"));
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(1);

    // Add a Rune of Speed to the champion, making the loadout different again
    championRunes.push(findItem("weapon-runes", "Rune of Speed"));
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(0);
  });

  test("Takes stackable amounts into account when comparing rune loadouts", () => {
    const list = getList();
    list.lords[0].items[0].selected[0].amount = 2; // Give the King a second Rune of Striking
    const items = list.lords[0].items[0].selected;

    // Thane with Runes of Striking (x1) and Cleaving
    list.heroes[0].items[0].selected = [
      findItem("weapon-runes", "Rune of Striking"),
      findItem("weapon-runes", "Rune of Cleaving"),
    ];
    const thaneRunes = list.heroes[0].items[0].selected;
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(0);

    // Give a second Rune of Striking, matching the King
    thaneRunes[0] = { ...thaneRunes[0], amount: 2 };
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(1);

    // Change the Thane to 1 Rune of Striking and 2 of Cleaving
    thaneRunes[0] = { ...thaneRunes[0], amount: 1 };
    thaneRunes[1] = { ...thaneRunes[1], amount: 2 };
    expect(combosUsedElsewhere(items, list, kingId)).toHaveLength(0);
  });
});
