import fr from "./fr.json";
import en from "./en.json";

const dictionaries = { fr, en } as const;
export type Lang = keyof typeof dictionaries;

export function getDict(lang: Lang = "fr") {
  return dictionaries[lang];
}

export function detectLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const stored = localStorage.getItem("rhmoi_lang");
  if (stored === "en") return "en";
  return "fr";
}
