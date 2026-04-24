/**
 * Static list of supported UI language options.
 *
 * Each entry contains:
 * - `value` — the BCP 47-like locale code used as the stored/validated value.
 * - `label` — the human-readable display name shown in dropdowns.
 *
 * `"auto"` is a special sentinel that lets the application infer the language
 * from the browser's locale.
 */
const languages = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "English" },
  { value: "nl", label: "Dutch" },
  { value: "fr", label: "French" },
];

/**
 * Array of valid language code strings derived from `languages`.
 *
 * Used by the `Language` schema filter to validate that a given string is one
 * of the accepted language values (e.g. `"auto"`, `"en"`, `"nl"`, `"fr"`).
 */
const languageValues = languages.map((lang) => lang.value);

/**
 * Returns the human-readable label for a given language code.
 *
 * @param value - A language code string (e.g. `"en"`, `"nl"`).
 * @returns The matching label (e.g. `"English"`), or `undefined` if the code
 *   is not found in the `languages` list.
 *
 * @example
 * getLanguageLabel("en")   // "English"
 * getLanguageLabel("nl")   // "Dutch"
 * getLanguageLabel("xx")   // undefined
 */
function getLanguageLabel(value: string): string | undefined {
  return languages.find((lang) => lang.value === value)?.label;
}

export { getLanguageLabel, languageValues, languages };
