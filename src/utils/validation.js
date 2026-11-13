import { rules, countExtraCategories, getMaxSlots } from "./rules";
import { uniq } from "./collection";
import { equalsOrIncludes } from "./string";
import { getUnitName, getUnitLeadership } from "./unit";
import { joinWithAnd, joinWithOr } from "./string";

const getGenerals = (units) =>
  !units?.length
    ? []
    : units.filter(
        (unit) =>
          unit.command &&
          unit.command.find(
            (command) => command.active && command.name_en === "General",
          ),
      );

const getHighestLeadership = (units, armyComposition) => {
  let highestLeadership = 0;

  (units || []).forEach((unit) => {
    if (
      unit.command &&
      unit.command.find(
        (command) =>
          command.name_en === "General" &&
          (!command.armyComposition ||
            equalsOrIncludes(command.armyComposition, armyComposition)),
      )
    ) {
      const leadership = getUnitLeadership(unit.name_en);

      if (leadership && leadership > highestLeadership) {
        highestLeadership = leadership;
      }
    }
  });

  return highestLeadership;
};

export const validateList = ({ list, language, intl }) => {
  const errors = [];
  const generals = [...getGenerals(list?.lords), ...getGenerals(list?.heroes)];
  // The general must be one of the characters with the highest leadership
  const highestLeadership = Math.max(
    getHighestLeadership(list?.lords, list.armyComposition),
    getHighestLeadership(list?.heroes, list.armyComposition),
  );

  const BSBs = !list.heroes?.length
    ? []
    : list.heroes.filter(
        (unit) =>
          unit.command &&
          unit.command.find(
            (command) =>
              command.active &&
              command.name_en.includes("Battle Standard Bearer"),
          ),
      );

  const generalsCount = generals.length;
  const BSBsCount = BSBs.length;
  const lordsUnitsRules = rules[list.armyComposition]
    ? rules[list.armyComposition].lords?.units
    : rules["grand-army"].lords?.units;
  const heroesUnitsRules = rules[list.armyComposition]
    ? rules[list.armyComposition].heroes?.units
    : rules["grand-army"].heroes?.units;
  const coreUnitsRules = rules[list.armyComposition]
    ? rules[list.armyComposition].core?.units
    : rules["grand-army"].core?.units;
  const specialUnitsRules = rules[list.armyComposition]
    ? rules[list.armyComposition].special?.units
    : rules["grand-army"].special?.units;
  const rareUnitsRules = rules[list.armyComposition]
    ? rules[list.armyComposition].rare?.units
    : rules["grand-army"].rare?.units;
  const alliesUnitsRules = rules[list.armyComposition]
    ? rules[list.armyComposition]?.allies?.units
    : rules["grand-army"]?.allies?.units;
  const mercenariesUnitsRules = rules[list.armyComposition]
    ? rules[list.armyComposition]?.mercenaries?.units
    : rules["grand-army"]?.mercenaries?.units;

  // Check total character slots (lords + heroes)
  const lordsSlots = list.lords?.length || 0;
  const heroesSlots =
    (list.heroes?.length || 0) +
    countExtraCategories(list, "heroes", list.armyComposition);
  const totalCharacterSlots = lordsSlots + heroesSlots;

  const totalMaxCharacterSlots =
    getMaxSlots({
      type: "characters",
      game: list.game,
      armyPoints: list.points,
      armyComposition: list.armyComposition || list.army,
      slots: totalCharacterSlots,
    }).maxSlots || 0;

  if (totalCharacterSlots > totalMaxCharacterSlots) {
    errors.push({
      message: "misc.error.tooManyCharacterSlots",
      section: "global",
    });
  }

  // No general
  generalsCount === 0 &&
    errors.push({
      message: "misc.error.noGeneral",
      section: "global",
    });

  // Multiple generals
  generalsCount > 1 &&
    errors.push({
      message: "misc.error.multipleGenerals",
      section: "global",
    });

  // General doesn't have highest leadership in the army
  const unitLeadership =
    generalsCount === 1 && getUnitLeadership(generals[0].name_en);

  generalsCount === 1 &&
    unitLeadership &&
    unitLeadership < highestLeadership &&
    errors.push({
      message: "misc.error.generalLeadership",
      section: "global",
    });

  // Options that must be the same in the whole army (e.g. Vampire Counts bloodlines)
  const sameInArmyChoices = {};
  [
    "characters",
    "lords",
    "heroes",
    "core",
    "special",
    "rare",
    "mercenaries",
    "allies",
  ].forEach((category) => {
    (list?.[category] || []).forEach((unit) => {
      (unit.options || [])
        .filter((option) => option.sameInArmy)
        .forEach((option) => {
          const choice = option.options?.find((subOption) => subOption.active);

          if (choice) {
            sameInArmyChoices[option.name_en] = sameInArmyChoices[
              option.name_en
            ] || {
              option: option[`name_${language}`] || option.name_en,
              names: [],
            };
            const choiceName = choice[`name_${language}`] || choice.name_en;

            !sameInArmyChoices[option.name_en].names.includes(choiceName) &&
              sameInArmyChoices[option.name_en].names.push(choiceName);
          }
        });
    });
  });
  Object.values(sameInArmyChoices).forEach(({ option, names }) => {
    names.length > 1 &&
      errors.push({
        message: "misc.error.sameOptionInArmy",
        section: "global",
        option,
        name: names.join(", "),
      });
  });

  // Multiple BSBs
  BSBsCount > 1 &&
    errors.push({
      message: "misc.error.multipleBSBs",
      section: "global",
    });

  const checkRules = ({ ruleUnit, type }) => {
    const unitsInList = (
      ruleUnit?.requiredByType === "all"
        ? [...list.characters, ...list.lords,...list.heroes, ...list.core, ...(list.core_not_count || []), ...list.special, ...list.rare]
        : (list[type] || [])
    ).filter(
      (unit) => ruleUnit.ids && ruleUnit.ids.includes(unit.id.split(".")[0]),
    );
    const requiredUnitsInList =
      ruleUnit.requiresType &&
      (ruleUnit.requiresType === "all"
        ? [...list.characters, ...list.lords,...list.heroes, ...list.core, ...(list.core_not_count || []), ...list.special, ...list.rare]
        : list[ruleUnit.requiresType]
      ).filter(
        (unit) =>
          ruleUnit.requires &&
          ruleUnit.requires.includes(unit.id.split(".")[0]),
      );
    const namesInList = joinWithOr(
      uniq(unitsInList.map((unit) => getUnitName({ unit, language }))),
    );
    const unitNames =
      ruleUnit.min > 0 &&
      joinWithOr(
        uniq(
          ruleUnit.ids.map((id) => {
            const name = intl.formatMessage({ id });

            return getUnitName({ unit: { name }, language });
          }),
        ),
      );
    const requiredNames =
      ruleUnit.requires &&
      joinWithOr(
        uniq(
          ruleUnit.requires.map((id) => {
            const name = intl.formatMessage({ id });

            return getUnitName({ unit: { name }, language });
          }),
        ),
      );
    const points = ruleUnit.points;
    const min = points
      ? Math.floor(list.points / points) * ruleUnit.min
      : ruleUnit.min;
    const max = points
      ? Math.floor(list.points / points) * ruleUnit.max
      : ruleUnit.max;

    // Not enough units
    if (
      (!ruleUnit.requires || (ruleUnit.requires && ruleUnit.requiresGeneral)) &&
      unitsInList.length < min
    ) {
      errors.push({
        message: "misc.error.minUnits",
        section: type,
        name: unitNames,
        min,
      });
    }

    // exceptIf: the max restriction does not apply if a matching unit is found.
    // Fields: unit (mandatory, unit id), general (optional bool), mount (optional, mount name_en), option (optional, option id)
    let exceptIfMet = false;
    if (ruleUnit.exceptIf) {
      const condition = ruleUnit.exceptIf;
      const allUnitsInList = [
        ...list.characters,
        ...list.lords,
        ...list.heroes,
        ...list.core,
        ...list.special,
        ...list.rare,
      ];

      // Pool to search in: if general:true, only look among generals; otherwise all units
      const pool = condition.general ? generals : allUnitsInList;

      exceptIfMet = pool.some((unit) => {
        // Must match the unit id
        if (unit.id.split(".")[0] !== condition.unit) return false;

        // If mount is specified, the unit must have that mount active (matched by id)
        if (condition.mount) {
          const hasMount = (unit.mounts || []).some(
            (mount) => mount.id === condition.mount && mount.active,
          );
          if (!hasMount) return false;
        }

        // If option is specified, the unit must have that option active
        if (condition.option) {
          const hasOption = (unit.options || []).some(
            (opt) => opt.id === condition.option && opt.active,
          );
          if (!hasOption) return false;
        }

        return true;
      });
    }

    // Too many units
    if (
      !exceptIfMet &&
      (!ruleUnit.requires || (ruleUnit.requires && ruleUnit.requiresGeneral)) &&
      unitsInList.length > max
    ) {
      errors.push({
        message: "misc.error.maxUnits",
        section: type,
        name: namesInList,
        diff: unitsInList.length - max,
      });
    }


    // requiresAny: max is as configured only if at least one condition is met, otherwise max is 0
    if (ruleUnit.requiresAny && unitsInList.length > 0) {
      const allUnits = [
        ...list.characters,
        ...list.lords,
        ...list.heroes,
        ...list.core,
        ...list.special,
        ...list.rare,
      ];

      const conditionMet = ruleUnit.requiresAny.some((condition) => {
        // Condition: a specific unit ID exists in the list
        if (condition.type === "unit") {
          return allUnits.some(
            (u) => u.id.split(".")[0] === condition.id,
          );
        }
        // Condition: a specific unit has a specific option active
        if (condition.type === "option") {
          return allUnits.some(
            (u) =>
              u.id.split(".")[0] === condition.unit &&
              (u.options || []).some(
                (opt) => opt.id === condition.id && opt.active,
              ),
          );
        }
        // Condition: a specific unit has a specific attached unit selected
        if (condition.type === "attachedUnit") {
          return allUnits.some(
            (u) =>
              u.id.split(".")[0] === condition.unit &&
              (u.attached_units?.selected || []).some(
                (a) => a.id === condition.id,
              ),
          );
        }
        return false;
      });

      if (!conditionMet) {
        const requiresAnyNames = joinWithOr(
          ruleUnit.requiresAny.map((condition) => {
            // For "unit" type, translate the unit id
            if (condition.type === "unit") {
              return intl.formatMessage({ id: condition.id });
            }
            // For "option" type, translate the option id
            if (condition.type === "option") {
              return intl.formatMessage({ id: condition.id });
            }
            // For "attachedUnit" type, translate the attached unit id
            if (condition.type === "attachedUnit") {
              return intl.formatMessage({ id: condition.id });
            }
            return condition.id;
          }),
        );
        errors.push({
          message: "misc.error.requiresAny",
          section: type,
          unit: namesInList,
          requires: requiresAnyNames,
        });
      }
    }

    // forbiddenIf: unit cannot be selected if any of the conditions are met (inverse of requiresAny)
    if (ruleUnit.forbiddenIf && unitsInList.length > 0) {
      const allUnits = [
        ...list.characters,
        ...list.lords,
        ...list.heroes,
        ...list.core,
        ...list.special,
        ...list.rare,
      ];

      const forbiddenConditionMet = ruleUnit.forbiddenIf.some((condition) => {
        // Condition: a specific unit ID exists in the list
        if (condition.type === "unit") {
          return allUnits.some(
            (u) => u.id.split(".")[0] === condition.id,
          );
        }
        // Condition: a specific unit has a specific option active
        if (condition.type === "option") {
          return allUnits.some(
            (u) =>
              u.id.split(".")[0] === condition.unit &&
              (u.options || []).some(
                (opt) => opt.id === condition.id && opt.active,
              ),
          );
        }
        // Condition: a specific unit has a specific attached unit selected
        if (condition.type === "attachedUnit") {
          return allUnits.some(
            (u) =>
              u.id.split(".")[0] === condition.unit &&
              (u.attached_units?.selected || []).some(
                (a) => a.id === condition.id,
              ),
          );
        }
        return false;
      });

      if (forbiddenConditionMet) {
        const forbiddenNames = joinWithOr(
          ruleUnit.forbiddenIf.map((condition) => {
            // For "unit" type, translate the unit id
            if (condition.type === "unit") {
              return intl.formatMessage({ id: condition.id });
            }
            // For "option" type, translate the option id
            if (condition.type === "option") {
              return intl.formatMessage({ id: condition.id });
            }
            // For "attachedUnit" type, translate the attached unit id
            if (condition.type === "attachedUnit") {
              return intl.formatMessage({ id: condition.id });
            }
            return condition.id;
          }),
        );
        errors.push({
          message: "misc.error.forbiddenIf",
          section: type,
          name: namesInList,
          forbiddenNames: forbiddenNames,
        });
      }
    }

    // forbiddenOptionIf: a specific option on the unit cannot be equipped if any of the conditions are met
    if (ruleUnit.forbiddenOptionIf && unitsInList.length > 0) {
      const allUnits = [
        ...list.characters,
        ...list.lords,
        ...list.heroes,
        ...list.core,
        ...(list.core_not_count || []),
        ...list.special,
        ...list.rare,
      ];

      ruleUnit.forbiddenOptionIf.forEach((forbiddenOption) => {
        const { optionId, conditions } = forbiddenOption;

        const unitWithOptionActive = unitsInList.find((unit) => {
          const hasActiveRangedOption = (unit.ranged || []).some(
            (opt) => opt.id === optionId && opt.active,
          );
          const hasActiveMeleeOption = (unit.melee || []).some(
            (opt) => opt.id === optionId && opt.active,
          );
          const hasActiveOption = (unit.options || []).some(
            (opt) => opt.id === optionId && opt.active,
          );
          return hasActiveRangedOption || hasActiveMeleeOption || hasActiveOption;
        });

        if (unitWithOptionActive) {
          const forbiddenConditionMet = conditions.some((condition) => {
            if (condition.type === "unit") {
              return allUnits.some((u) => u.id.split(".")[0] === condition.id);
            }
            if (condition.type === "option") {
              return allUnits.some(
                (u) =>
                  u.id.split(".")[0] === condition.unit &&
                  (u.options || []).some(
                    (opt) => opt.id === condition.id && opt.active,
                  ),
              );
            }
            if (condition.type === "attachedUnit") {
              return allUnits.some(
                (u) =>
                  u.id.split(".")[0] === condition.unit &&
                  (u.attached_units?.selected || []).some(
                    (a) => a.id === condition.id,
                  ),
              );
            }
            return false;
          });

          if (forbiddenConditionMet) {
            const optionName = intl.formatMessage({ id: optionId });
            const forbiddenNames = joinWithOr(
              conditions.map((condition) => {
                if (condition.type === "unit") return intl.formatMessage({ id: condition.id });
                if (condition.type === "option") return intl.formatMessage({ id: condition.id });
                if (condition.type === "attachedUnit") return intl.formatMessage({ id: condition.id });
                return condition.id;
              }),
            );
            errors.push({
              message: "misc.error.forbiddenOptionIf",
              section: type,
              name: namesInList,
              option: optionName,
              forbiddenNames: forbiddenNames,
            });
          }
        }
      });
    }

    // Duplicated named units - named units can only have max 1 in the list
    if ( unitsInList.length > 0) {
      const processedNamedUnits = new Set();
      unitsInList.forEach((unit) => {
        if (unit.named) {
          const unitId = unit.id.split(".")[0];
          const namedUnitCount = unitsInList.filter(
            (u) => u.named && u.id.split(".")[0] === unitId
          ).length;

          if (namedUnitCount > 1 && !processedNamedUnits.has(unitId)) {
            errors.push({
              message: "misc.error.maxNamed",
              section: type,
              name: getUnitName({ unit, language }),
            });
            processedNamedUnits.add(unitId);
          }
        }
      });
    }

    // Unit requires general
    if (ruleUnit.requiresGeneral && unitsInList.length > 0) {
      const matchingGeneral = generals.find((general) => {
        return ruleUnit.requires.includes(general.id.split(".")[0]);
      });

      !matchingGeneral &&
        errors.push({
          message: "misc.error.requiresGeneral",
          section: type,
          name: requiredNames,
        });

      // Unit requires general with specific active option
      if (ruleUnit.requiresOption) {
        const generalWithOption = generals
          .filter(
            (general) =>
              ruleUnit.requiresOption.unit === general.id.split(".")[0],
          )
          .find((general) =>
            general.options.find(
              (option) =>
                option.id === ruleUnit.requiresOption.id && option.active,
            ),
          );

        if (
          !generalWithOption &&
          matchingGeneral &&
          matchingGeneral.id.split(".")[0] === ruleUnit.requiresOption.unit
        ) {
          errors.push({
            message: "misc.error.requiresOption",
            section: type,
            name: intl.formatMessage({ id: ruleUnit.requiresOption.unit }),
            option: intl.formatMessage({ id: ruleUnit.requiresOption.id }),
          });
        }
      }
    }

    // Unit requires general with specific active mount
    if (ruleUnit.requiresMount && unitsInList.length > 0) {
      const generalWithMount = generals
        .filter(
          (general) =>
            ruleUnit.requiresMount.unit === general.id.split(".")[0],
        )
        .find((general) =>
          general.mounts.find(
            (mount) =>
              mount.name_en === ruleUnit.requiresMount.name && mount.active,
          ),
        );

      if (!generalWithMount) {
        errors.push({
          message: "misc.error.requiresMount",
          section: type,
          name: intl.formatMessage({ id: ruleUnit.requiresMount.unit }),
          mount: ruleUnit.requiresMount.name,
        });
      }
    }

    // General requires unit
    if (ruleUnit.requiresIfGeneral && generals.length > 0) {
      const requiredUnitsByGeneralInList = [
        ...list.characters,
        ...list.lords,
        ...list.heroes,
        ...list.core,
        ...list.special,
        ...list.rare,
      ].filter(
        (unit) =>
          ruleUnit.requiresIfGeneral &&
          ruleUnit.requiresIfGeneral.includes(unit.id.split(".")[0]),
      );
      if (requiredUnitsByGeneralInList.length === 0) {
        errors.push({
          message: "misc.error.requiresUnits",
          section: type,
          name: ruleUnit.requiresIfGeneral,
          diff: 1,
        });
      }
    }

    // Unit should be mounted
    if (ruleUnit.requiresMounted && unitsInList.length > 0) {
      const charactersNotMounted = unitsInList.filter(
        (character) =>
          !Boolean(
            character.mounts.find(
              (mount) => mount.active && mount.name_en !== "On foot",
            ),
          ),
      );
      const requiredNames = joinWithAnd(
        charactersNotMounted.map((unit) => getUnitName({ unit, language })),
      );

      charactersNotMounted.length &&
        errors.push({
          message: "misc.error.requiresMounted",
          section: type,
          name: requiredNames,
        });
    }

    // Unit requires specific active option
    if (ruleUnit.requiresOption) {
      const charactersInList = unitsInList.filter(
        (character) =>
          ruleUnit.requiresOption.unit === character.id.split(".")[0],
      );
      const characterWithOption = charactersInList.find((character) =>
        character.options.find(
          (option) => option.id === ruleUnit.requiresOption.id && option.active,
        ),
      );

      if (charactersInList.length && !characterWithOption) {
        errors.push({
          message: "misc.error.requiresOption",
          section: type,
          name: intl.formatMessage({ id: ruleUnit.requiresOption.unit }),
          option: intl.formatMessage({ id: ruleUnit.requiresOption.id }),
        });
      }
    }

    // Unit requires specific active command
    if (ruleUnit.requiresCommand) {
      const charactersInList = unitsInList.filter(
        (character) =>
          ruleUnit.requiresCommand.unit === character.id.split(".")[0],
      );
      const characterWithCommand = charactersInList.find((character) =>
        character.commands.find(
          (command) =>
            command.id === ruleUnit.requiresCommand.id && command.active,
        ),
      );

      if (charactersInList.length && !characterWithCommand) {
        errors.push({
          message: "misc.error.requiresCommand",
          section: type,
          name: intl.formatMessage({ id: ruleUnit.requiresCommand.unit }),
          command: intl.formatMessage({ id: ruleUnit.requiresCommand.id }),
        });
      }
    }

    // Requires other unit
    if (!ruleUnit.requiresGeneral && ruleUnit.requires) {
      if (!max && ruleUnit.perUnit && unitsInList.length < min) {
        errors.push({
          message: "misc.error.minUnits",
          section: type,
          name: unitNames,
          min,
        });
      }

      // Each other unit allows another unit
      if (
        max &&
        ruleUnit.perUnit &&
        unitsInList.length > requiredUnitsInList.length * max
      ) {
        errors.push({
          message: "misc.error.requiresUnits",
          section: type,
          name: requiredNames,
          diff: unitsInList.length - requiredUnitsInList.length * max,
        });
        // Each other unit allows another unit with scaling max value
      } else if (
        !max &&
        ruleUnit.perUnit &&
        unitsInList.length > requiredUnitsInList.length + min
      ) {
        errors.push({
          message: "misc.error.requiresUnits",
          section: type,
          name: requiredNames,
          diff: unitsInList.length - requiredUnitsInList.length - min,
        });
      } else if (
        !ruleUnit.perUnit &&
        !requiredUnitsInList.length &&
        unitsInList.length > 0
      ) {
        errors.push({
          message: "misc.error.requiresUnits",
          section: type,
          name: requiredNames,
          diff: 1,
        });
      }
      if (!ruleUnit.perUnit && unitsInList.length > max) {
        errors.push({
          message: "misc.error.maxUnits",
          section: type,
          name: namesInList,
          diff: unitsInList.length - max,
        });
      }
    }

    // Requires magic item
    if (ruleUnit.requiresMagicItem && unitsInList.length > 0) {
      let hasMagicItem;

      generals.forEach((unit) => {
        unit.items.forEach((itemCategory) => {
          if (
            itemCategory.selected.find(
              (item) =>
                item.name_en.replace(/ /g, "-").toLowerCase() ===
                ruleUnit.requiresMagicItem,
            )
          ) {
            hasMagicItem = true;
          }
        });
      });

      !hasMagicItem &&
        errors.push({
          message: "misc.error.requiresMagicItem",
          section: type,
          name: intl.formatMessage({ id: ruleUnit.requiresMagicItem }),
        });
    }
  };

  lordsUnitsRules &&
    lordsUnitsRules.forEach((ruleUnit) => {
      checkRules({ ruleUnit, type: "lords" });
    });

  heroesUnitsRules &&
    heroesUnitsRules.forEach((ruleUnit) => {
      checkRules({ ruleUnit, type: "heroes" });
    });

  coreUnitsRules &&
    coreUnitsRules.forEach((ruleUnit) => {
      checkRules({ ruleUnit, type: "core" });
    });

  specialUnitsRules &&
    specialUnitsRules.forEach((ruleUnit) => {
      checkRules({ ruleUnit, type: "special" });
    });

  rareUnitsRules &&
    rareUnitsRules.forEach((ruleUnit) => {
      checkRules({ ruleUnit, type: "rare" });
    });

  alliesUnitsRules &&
    alliesUnitsRules.forEach((ruleUnit) => {
      checkRules({ ruleUnit, type: "allies" });
    });

  mercenariesUnitsRules &&
    mercenariesUnitsRules.forEach((ruleUnit) => {
      checkRules({ ruleUnit, type: "mercenaries" });
    });

  return errors;
};
