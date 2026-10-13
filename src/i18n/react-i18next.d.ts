import type { fa } from "./fa";

// Type augmentation for react-i18next so `t()` is fully typed against our catalogs.
// The Persian catalog is the reference for keys; `en` must provide the same keys.
declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "translation";
        resources: {
            translation: typeof fa;
        };
        // Interpolation placeholders in the catalogs are numeric (`{n}`, `{count}`, `{meters}`),
        // so allow numbers in addition to strings when calling `t(key, params)`.
    }
}

declare module "react-i18next" {
    interface CustomTypeOptions {
        resources: {
            translation: typeof fa;
        };
    }
}
