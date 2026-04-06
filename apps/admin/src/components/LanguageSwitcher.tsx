import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "fr";

  function toggle() {
    const next = currentLang === "fr" ? "en" : "fr";
    i18n.changeLanguage(next);
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      title={currentLang === "fr" ? "Switch to English" : "Passer en français"}
    >
      <Globe className="h-3.5 w-3.5" />
      {currentLang === "fr" ? "EN" : "FR"}
    </button>
  );
}
