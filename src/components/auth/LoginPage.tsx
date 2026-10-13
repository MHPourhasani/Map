import { useState, type FormEvent } from "react";
import { KeyRound, LogIn, MapPin } from "lucide-react";
import { LOCAL_ACCOUNTS, useAccess } from "../../access";
import { useT } from "../../i18n";

/** Full-screen login shown until the user signs in with one of the local demo accounts */
export function LoginPage() {
    const t = useT();
    const { login } = useAccess();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!username.trim() || !password) {
            setError(t("auth.required"));
        } else if (login(username, password)) {
            setError(null);
            setPassword("");
        } else {
            setError(t("auth.error"));
        }
    };

    return (
        <div className="pm-login">
            <form className="glass pm-login__card" onSubmit={handleSubmit}>
                <div className="pm-login__brand">
                    <span className="pm-login__icon" aria-hidden="true">
                        <MapPin size={22} />
                    </span>
                    <h1 className="pm-login__title">{t("auth.title")}</h1>
                    <p className="pm-login__subtitle">{t("auth.subtitle")}</p>
                </div>

                <label className="pm-login__field">
                    <span>{t("auth.username")}</span>
                    <input
                        type="text"
                        autoComplete="username"
                        dir="ltr"
                        placeholder={t("auth.usernamePlaceholder")}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </label>

                <label className="pm-login__field">
                    <span>{t("auth.password")}</span>
                    <input
                        type="password"
                        autoComplete="current-password"
                        dir="ltr"
                        placeholder={t("auth.passwordPlaceholder")}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </label>

                {error && (
                    <p className="pm-login__error" role="alert">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={!username || !password} className="pm-login__submit">
                    <LogIn size={16} aria-hidden="true" />
                    {t("auth.submit")}
                </button>

                <div className="pm-login__hint">
                    <p>
                        <KeyRound size={14} aria-hidden="true" />
                        {t("auth.hint")}
                    </p>
                    <ul>
                        {LOCAL_ACCOUNTS.map((account) => (
                            <li key={account.username}>
                                <code dir="ltr">
                                    {account.username} / {account.password}
                                </code>
                                <span>{t(`access.level.${account.level}`)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </form>
        </div>
    );
}
