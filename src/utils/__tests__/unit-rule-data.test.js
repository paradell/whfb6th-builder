import { getStats, getUnitRuleData } from "../unit";

describe("getUnitRuleData", () => {
  it("uses the entry for the full name when it exists", () => {
    expect(getStats({ name_en: "Vampire Count (Strigoi)" })[0]).toMatchObject({
      A: "5",
      WS: "7",
    });
    expect(
      getStats({ name_en: "Vampire Count (Blood Dragon)" })[0],
    ).toMatchObject({ A: "4", WS: "9" });
  });

  it("falls back to the normalized name", () => {
    expect(getUnitRuleData("Vampire Count (Unknown)")).toBe(
      getUnitRuleData("Vampire Count"),
    );
  });
});
