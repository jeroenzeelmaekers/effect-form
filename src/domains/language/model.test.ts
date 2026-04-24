import { describe, expect, it } from "vitest";

import { getLanguageLabel, languageValues, languages } from "./model";

describe("languages", () => {
  it("should contain all expected language entries", () => {
    expect(languages).toEqual([
      { value: "auto", label: "Auto" },
      { value: "en", label: "English" },
      { value: "nl", label: "Dutch" },
      { value: "fr", label: "French" },
    ]);
  });
});

describe("languageValues", () => {
  it("should contain the value of each language entry", () => {
    expect(languageValues).toEqual(["auto", "en", "nl", "fr"]);
  });

  it("should match the values from languages", () => {
    expect(languageValues).toEqual(languages.map((l) => l.value));
  });
});

describe("getLanguageLabel", () => {
  it.each([
    ["auto", "Auto"],
    ["en", "English"],
    ["nl", "Dutch"],
    ["fr", "French"],
  ])("should return '%s' for value '%s'", (value, label) => {
    expect(getLanguageLabel(value)).toBe(label);
  });

  it("should return undefined for an unknown language code", () => {
    expect(getLanguageLabel("xx")).toBeUndefined();
  });

  it("should return undefined for an empty string", () => {
    expect(getLanguageLabel("")).toBeUndefined();
  });
});
