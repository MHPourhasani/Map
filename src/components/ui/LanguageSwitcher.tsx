import { LANGUAGES, changeLanguage, useLanguage, useT } from "../../i18n";
import { cn } from "../../utils/cn";

export function LanguageSwitcher() {
    const t = useT();
    const active = useLanguage();

    return (
        <div className="pm-lang" role="group" aria-label={t("language.label")}>
            {LANGUAGES.map((language) => (
                <button
                    key={language.code}
                    type="button"
                    className={cn("pm-lang__btn", active === language.code && "is-active")}
                    aria-pressed={active === language.code}
                    title={t("language.switch")}
                    onClick={() => void changeLanguage(language.code)}
                >
                    {language.label}
                </button>
            ))}
        </div>
    );
}
