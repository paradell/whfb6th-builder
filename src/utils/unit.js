import classNames from "classnames";

import { nameMap } from "../pages/magic";
import { rulesMap, synonyms } from "../components/rules-index";
import loresOfMagicWithSpells from "../assets/lores-of-magic-with-spells.json";
import { normalizeRuleName } from "./string";

export const getUnitRuleData = (unitName) => {
  const normalizedRuleName = normalizeRuleName(unitName);
  const synonym = synonyms[normalizedRuleName];
  return rulesMap[synonym || normalizedRuleName];
};

export const getUnitLeadership = (unitName) => {
  const ruleData = getUnitRuleData(unitName);

  if (!ruleData) {
    return false;
  }

  return ruleData.stats?.length
    ? ruleData.stats.reduce(
        (previousValue, statLine) =>
          (parseInt(statLine.Ld) || 0) > previousValue
            ? parseInt(statLine.Ld)
            : previousValue,
        0,
      )
    : 0;
};

export const getAllOptions = (
  {
    mounts,
    equipment,
    melee,
    ranged,
    armor,
    options,
    command,
    items,
    activeLore,
    lores: unitLores,
    armyComposition: unitArmyComposition,
  },
  {
    removeFactionName = true,
    noMagic,
    language: overrideLanguage,
    pageNumbers,
    armyComposition,
  } = {},
) => {
  const language = overrideLanguage || localStorage.getItem("lang");
  const lores = unitArmyComposition?.[armyComposition]?.lores || unitLores;
  const allCommand = [];
  const allMounts = [];
  const allOptions = [];

  if (command) {
    command.forEach(({ active, magic, name_en, options, ...entry }) => {
      if (active) {
        let commandEntry = entry[`name_${language}`] || name_en;
        const selectedOptions = [];

        if (options && options.length > 0) {
          options.forEach((option) => {
            if (option.active) {
              selectedOptions.push(option.name_en);
            }
          });
        }

        if (magic && magic?.selected?.length && !noMagic) {
          magic.selected.forEach((selectedItem) => {
            selectedOptions.push(
              selectedItem.amount > 1
                ? `${selectedItem.amount}x ` +
                    selectedItem[`name_${language}`] || selectedItem.name_en
                : selectedItem[`name_${language}`] || selectedItem.name_en,
            );
          });
        }

        if (selectedOptions.length) {
          commandEntry += ` [${selectedOptions.join(" + ")}]`;
        }

        allCommand.push(commandEntry);
      }
    });
  }
  const allEquipment = equipment // TODO
    ? equipment
        .filter(({ requiredOption }) =>
          hasRequiredOption({ options }, requiredOption),
        )
        .filter(
          ({ active, equippedDefault, requiredMagicItem }) =>
            (active && !requiredMagicItem) ||
            (equippedDefault && !requiredMagicItem) ||
            (active &&
              requiredMagicItem &&
              unitHasItem({ items }, requiredMagicItem)),
        )
        .map(({ name_en, ...item }) => item[`name_${language}`] || name_en)
    : [];
  const allMelee = melee
      ? melee
          .filter(({ requiredOption }) =>
            hasRequiredOption({ options }, requiredOption),
          )
          .filter(
              ({ active, equippedDefault, requiredMagicItem }) =>
                  (active && !requiredMagicItem) ||
                  (equippedDefault && !requiredMagicItem) ||
                  (active &&
                      requiredMagicItem &&
                      unitHasItem({ items }, requiredMagicItem)),
          )
          .map(({ name_en, ...item }) => item[`name_${language}`] || name_en)
      : [];
  const allRanged = ranged
      ? ranged
          .filter(({ requiredOption }) =>
            hasRequiredOption({ options }, requiredOption),
          )
          .filter(
              ({ active, equippedDefault, requiredMagicItem }) =>
                  (active && !requiredMagicItem) ||
                  (equippedDefault && !requiredMagicItem) ||
                  (active &&
                      requiredMagicItem &&
                      unitHasItem({ items }, requiredMagicItem)),
          )
          .map(({ name_en, ...item }) => item[`name_${language}`] || name_en)
      : [];
  const allArmor = armor
    ? armor
        .filter(({ requiredOption }) =>
          hasRequiredOption({ options }, requiredOption),
        )
        .filter(
          ({ active, requiredMagicItem }) =>
            (active && !requiredMagicItem) ||
            (active &&
              requiredMagicItem &&
              unitHasItem({ items }, requiredMagicItem)),
        )
        .map(({ name_en, ...item }) => item[`name_${language}`] || name_en)
    : [];

  if (options) {
    options.forEach(
      ({
        active,
        name_en,
        options: subOptions,
        stackableCount,
        requiredMagicItem,
        requiredOption,
        ...entry
      }) => {
        if (!hasRequiredOption({ options }, requiredOption)) {
          return;
        }
        if (
          (active && !requiredMagicItem) ||
          (active &&
            requiredMagicItem &&
            unitHasItem({ items }, requiredMagicItem))
        ) {
          let optionEntry = entry[`name_${language}`] || name_en;
          const selectedOptions = [];

          if (subOptions && subOptions.length > 0) {
            subOptions.forEach((option) => {
              if (option.active) {
                selectedOptions.push(option.name_en);
              }
            });
          }

          if (selectedOptions.length) {
            optionEntry += ` [${selectedOptions.join(" + ")}]`;
          }

          allOptions.push(optionEntry);
        } else if (stackableCount > 0) {
          allOptions.push(
            `${stackableCount}x ${entry[`name_${language}`] || name_en}`,
          );
        }
      },
    );
  }

  if (mounts) {
    mounts
      .filter(({ requiredOption }) =>
        hasRequiredOption({ options }, requiredOption),
      )
      .filter(
        ({ active, equippedDefault, requiredMagicItem }) =>
          (active && !requiredMagicItem) ||
          (equippedDefault && !requiredMagicItem) ||
          (active &&
            requiredMagicItem &&
            unitHasItem({ items }, requiredMagicItem)),
      )
      .forEach(({ active, name_en, options, ...entry }) => {
        if (active) {
          let mountEntry = entry[`name_${language}`] || name_en;
          const selectedOptions = [];

          if (options && options.length > 0) {
            options.forEach((option) => {
              if (option.active) {
                selectedOptions.push(option.name_en);
              }
            });
          }

          if (selectedOptions.length) {
            mountEntry += ` [${selectedOptions.join(" + ")}]`;
          }

          allMounts.push(mountEntry);
        }
      });
  }

  const allItems = [];
  if (items?.length) {
    items
      .filter(({ requiredOption }) =>
        hasRequiredOption({ options }, requiredOption),
      )
      .forEach((item) => {
      (item.selected || []).forEach((selectedItem) => {
        allItems.push(
          selectedItem.amount > 1
            ? `${selectedItem.amount}x ` +
                (selectedItem[`name_${language}`] || selectedItem.name_en)
            : selectedItem[`name_${language}`] || selectedItem.name_en,
        );
      });
    });
  }
  const lore = [];
  if (isWizard({ options, command, mounts })) {
    if (activeLore && nameMap[activeLore].name_en !== "None") {
      lore.push(
        nameMap[activeLore][`name_${language}`] || nameMap[activeLore].name_en,
      );
    } else if (lores?.length && nameMap[lores[0]].name_en !== "None") {
      lore.push(
        nameMap[lores[0]][`name_${language}`] || nameMap[lores[0]].name_en,
      );
    }
  }

  let allOptionsArray = [
    ...allEquipment,
    ...allMelee,
    ...allRanged,
    ...allArmor,
    ...allOptions,
    ...allCommand,
    ...allMounts,
    ...(!noMagic ? allItems : []),
    ...lore,
  ];

  if (pageNumbers) {
    allOptionsArray = allOptionsArray.map((option) => {
      const page = getPage(option);

      if (page) {
        return `${option} [${page}]`;
      }
      return option;
    });
  }

  let allOptionsString = allOptionsArray.join(", ").replace(/\*/g, "");

  if (removeFactionName) {
    allOptionsString = allOptionsString.replace(/ *\{[^)]*\}/g, "");
  }

  if (allOptionsString) {
    return allOptionsString;
  }
  return null;
};

export const getPage = (name) => {
  const page = getUnitRuleData(name)?.page || "";

  return page.replace(/,/g, "");
};

export const getStats = (unit) => {
  const normalizedName = normalizeRuleName(unit.name_en);
  const synonym = synonyms[normalizedName];
  const stats = rulesMap[synonym || normalizedName]?.stats || [];
  const activeMount = unit.mounts
    ? unit.mounts.find((mount) => mount.active)
    : null;
  const mountStats = getUnitRuleData(activeMount?.name_en || "")?.stats || [];

  return [...stats, ...mountStats];
};

export const getUnitName = ({ unit, language }) => {
  return (unit.name || unit[`name_${language}`] || unit.name_en).replace(
    / *\{[^)]*\}/g,
    "",
  );
};

export const getUnitOptionNotes = ({
  notes,
  key,
  className,
  language,
  disabled,
}) => {
  return (Array.isArray(notes) ? [...notes] : notes ? [notes] : []).map(
    (note, index) => (
      <p
        className={classNames(
          className,
          disabled && "unit__option-note--disabled",
        )}
        key={`${key}-${index}`}
      >
        {note[`name_${language}`] || note.name_en}
      </p>
    ),
  );
};

/**
 * Recursive lookup of a unit option satisfying the test function argument.
 * By default, when onlyFollowActiveOptions is true, the function will only
 * look deeper in sub options if the parent option is active.
 * Return the first matching option or undefined.
 */
export const findOption = (
  options,
  testFunc,
  onlyFollowActiveOptions = true,
) => {
  if (Array.isArray(options)) {
    for (const option of options) {
      const foundOption = findOption(option, testFunc, onlyFollowActiveOptions);
      if (foundOption) {
        return foundOption;
      }
    }
  } else if (testFunc(options)) {
    return options;
  } else if ((!onlyFollowActiveOptions || options.active) && options.options) {
    return findOption(options.options, testFunc, onlyFollowActiveOptions);
  }
  return undefined;
};

/**
 * Recursive lookup of all unit options satisfying the test function argument.
 * By default, when onlyFollowActiveOptions is true, the function will only
 * look deeper in sub options if the parent option is active.
 * Return an array of options (empty if nothing found).
 */
export const findAllOptions = (
  options,
  testFunc,
  onlyFollowActiveOptions = true,
) => {
  const foundOptions = [];

  if (Array.isArray(options)) {
    for (const option of options) {
      foundOptions.push(
        ...findAllOptions(option, testFunc, onlyFollowActiveOptions),
      );
    }
  } else if (options) {
    if (testFunc(options)) {
      foundOptions.push(options);
    }
    if ((!onlyFollowActiveOptions || options.active) && options.options) {
      foundOptions.push(
        ...findAllOptions(options.options, testFunc, onlyFollowActiveOptions),
      );
    }
  }
  return foundOptions;
};

/**
 * Returns true if a unit is equipped with given itemName (not case sensitive),
 * false otherwise.
 */
/**
 * Checks if the unit has an active option, or sub-option, with one of the given ids.
 * Used by entries with "requiredOption", e.g. equipment only available to a bloodline.
 *
 * @param {object} unit
 * @param {string|string[]} optionIds
 * @returns {boolean}
 */
export const unitHasOption = (unit, optionIds) => {
  const ids = [].concat(optionIds);

  return Boolean(
    unit.options?.some(
      (option) =>
        (option.active && ids.includes(option.id)) ||
        option.options?.some(
          (subOption) => subOption.active && ids.includes(subOption.id),
        ),
    ),
  );
};

export const hasRequiredOption = (unit, requiredOption) =>
  !requiredOption || unitHasOption(unit, requiredOption);

/**
 * After the unit options change, deselects the entries whose "requiredOption" is no
 * longer active, so hidden equipment, mounts or magic items don't stay in the list.
 * Always active entries that become available again are reactivated.
 *
 * @param {object} unit The unit with its new options
 * @returns {object} The changed unit fields, to be passed to editUnit
 */
export const getRequiredOptionCleanup = (unit) => {
  const isAvailable = ({ requiredOption }) =>
    hasRequiredOption(unit, requiredOption);
  const updateActive = (entries) =>
    entries?.map((entry) => {
      if (!entry.requiredOption) {
        return entry;
      }

      return {
        ...entry,
        active:
          isAvailable(entry) && Boolean(entry.active || entry.alwaysActive),
      };
    });
  let mounts = unit.mounts;

  if (mounts?.some((mount) => mount.active && !isAvailable(mount))) {
    const fallbackMount = mounts.find(isAvailable);

    mounts = mounts.map((mount) => ({
      ...mount,
      active: mount === fallbackMount,
      options:
        mount === fallbackMount
          ? mount.options
          : mount.options?.map((option) => ({ ...option, active: false })),
    }));
  }

  return {
    options: updateActive(unit.options),
    equipment: updateActive(unit.equipment),
    melee: updateActive(unit.melee),
    ranged: updateActive(unit.ranged),
    armor: updateActive(unit.armor),
    mounts,
    items: unit.items?.map((item) =>
      isAvailable(item) ? item : { ...item, selected: [] },
    ),
  };
};

export const unitHasItem = (unit, itemName) => {
  if (unit.items) {
    for (const itemCategory of unit.items) {
      if (
        itemCategory.selected &&
        itemCategory.selected.find(
          ({ name_en }) => name_en.toLowerCase() === itemName.toLowerCase(),
        )
      ) {
        return true;
      }
    }
  }
  return false;
};

export const isWizard = (unitToCheck) => {
  const unit = {
    ...unitToCheck,
    options: unitToCheck.options || [],
  };
  return (
    optionsHaveActiveWizard(unit) ||
    hasActiveWizardOption(unitToCheck.command) ||
    hasActiveWizardOption(unitToCheck.mounts)
  );
};

export const optionsHaveActiveWizard = (optionHolder) => {
  return Boolean(
    findOption(
      optionHolder.options,
      ({ name_en, active }) =>
        active && name_en.toLowerCase().includes("wizard"),
    ),
  );
};

export const hasActiveWizardOption = (optionHoldersList) => {
  const allOptionsForActiveHolders = {
    ...optionHoldersList,
    options:
      optionHoldersList && optionHoldersList.length
        ? optionHoldersList
            .filter((optionHolder) => optionHolder.active)
            .filter((activeOptionHolder) => activeOptionHolder.options)
            .flatMap(
              (activeOptionHolderWithOptions) =>
                activeOptionHolderWithOptions.options,
            )
        : [],
  };
  return optionsHaveActiveWizard(allOptionsForActiveHolders);
};

/**
 * Returns the lores of magic and their spells the unit can use based on its
 * special rules and its selected lore.
 */
export const getUnitLoresWithSpells = (unit, armyComposition) => {
  const specialRuleLores = (unit?.specialRules?.name_en || "")
    .split(", ")
    .filter((rule) => /^Lore of/.test(rule))
    .reduce((result, rule) => {
      const loreId = rule.toLowerCase().replace(/ /g, "-");

      return {
        ...result,
        [loreId]: loresOfMagicWithSpells[loreId],
      };
    }, {});

  const unitLores = unit.armyComposition
    ? unit.armyComposition[armyComposition]?.lores
      ? unit.armyComposition[armyComposition].lores
      : unit.lores || []
    : unit.lores || [];

  const selectedLores =
    unitLores.length > 0
      ? {
          [unit.activeLore ?? unitLores[0]]:
            loresOfMagicWithSpells[unit.activeLore ?? unitLores[0]],
        }
      : {};

  return { ...specialRuleLores, ...selectedLores };
};

/**
 * Search for "Level x Wizard" in the unit options and deduct the unit level of
 * wizardry.
 */
export const getUnitWizardryLevel = (unit) => {
  if (unitHasItem(unit, "Loremaster")) {
    return 1;
  }

  const levelOptions = findAllOptions(unit?.options, (option) =>
    /^Level [1234] Wizard/.test(option?.name_en),
  );

  let wizardryLevel = 4;

  for (let i = 0; i < levelOptions.length; i++) {
    const levelOptionValue = Number(levelOptions[i].name_en.match(/[1234]/)[0]);

    if (levelOptions[i].active) {
      return unitHasItem(unit, "Master Of The Black Arts")
        ? levelOptionValue + 1
        : levelOptionValue;
    }
    if (levelOptionValue <= wizardryLevel) {
      wizardryLevel = levelOptionValue - 1;
    }
  }

  return wizardryLevel === 4 ? 0 : wizardryLevel;
};

/**
 * Return the number of spells a unit can generate based on its level of
 * wizardry, magic items and special rules.
 */
export const getUnitGeneratedSpellCount = (unit) => {
  let generatedSpellsCount = getUnitWizardryLevel(unit);

  if (unitHasItem(unit, "Tome Of Furion")) {
    generatedSpellsCount += 1;
  }

  return generatedSpellsCount;
};
