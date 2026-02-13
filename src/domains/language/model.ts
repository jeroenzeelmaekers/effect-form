const languages = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "English" },
  { value: "nl", label: "Dutch" },
  { value: "fr", label: "French" },
];

const languageValues = languages.map((lang) => lang.value);

function getLanguageLabel(value: string): string | undefined {
  return languages.find((lang) => lang.value === value)?.label;
}

export { getLanguageLabel, languageValues, languages };
