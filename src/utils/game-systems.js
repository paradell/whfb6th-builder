import theOldWorld from "../assets/the-old-world.json";
import WarhammerFantasy6th from "../assets/warhammer-fantasy-6th.json";

export const getGameSystems = () => {
  const customSystems = JSON.parse(localStorage.getItem("whfb.systems")) || [];
  const allGameSystems = [theOldWorld, WarhammerFantasy6th, ...customSystems];

  return allGameSystems;
};

export const getCustomDatasetData = (army) => {
  const localDatasets = JSON.parse(localStorage.getItem("whfb.datasets")) || [];
  const dataset = localDatasets.find((dataset) => dataset.id === army);
  const data = dataset?.data;

  return data;
};
