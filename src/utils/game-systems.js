import theOldWorld from "../assets/the-old-world.json";
import WarhammerFantasy6th from "../assets/warhammer-fantasy-6th.json";
import WarhammerFantasyMdn from "../assets/warhammer-fantasy-mdn.json";

export const OFFICIAL_GAME_SYSTEMS = ["the-old-world", "warhammer-fantasy-6th", "warhammer-fantasy-mdn"];

export const isOfficialSystem = (gameId) => {
  return OFFICIAL_GAME_SYSTEMS.includes(gameId);
};

export const getGameSystems = () => {
  const customSystems = JSON.parse(localStorage.getItem("whfb.systems")) || [];
  const officialSystems = [theOldWorld, WarhammerFantasy6th, WarhammerFantasyMdn];

  // For each custom system: if it shares the ID of an official system, merge its armies
  // into the official system instead of adding it as a duplicate.
  const mergedOfficials = officialSystems.map((official) => {
    const override = customSystems.find((cs) => cs.id === official.id);
    if (!override) return official;

    // Build a merged armies list: official armies first, then any extra armies from
    // the custom system that don't already exist in the official list.
    const officialArmyIds = new Set(official.armies.map((a) => a.id));
    const extraArmies = override.armies.filter((a) => !officialArmyIds.has(a.id));
    return { ...official, armies: [...official.armies, ...extraArmies] };
  });

  // Only add custom systems whose ID is NOT already handled by an official system.
  const trueCustomSystems = customSystems.filter(
    (cs) => !OFFICIAL_GAME_SYSTEMS.includes(cs.id)
  );

  return [...mergedOfficials, ...trueCustomSystems];
};

export const getCustomDatasetData = (army) => {
  const localDatasets = JSON.parse(localStorage.getItem("whfb.datasets")) || [];
  const dataset = localDatasets.find((dataset) => dataset.id === army);
  const data = dataset?.data;

  return data;
};
