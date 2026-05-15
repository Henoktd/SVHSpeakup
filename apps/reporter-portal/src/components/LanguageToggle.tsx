import { useLanguage } from "../i18n";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-toggle" aria-label="Language">
      <button
        aria-pressed={language === "en"}
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
        type="button"
      >
        {t("language.english")}
      </button>
      <button
        aria-pressed={language === "am"}
        className={language === "am" ? "active" : ""}
        onClick={() => setLanguage("am")}
        type="button"
      >
        {t("language.amharic")}
      </button>
    </div>
  );
}
