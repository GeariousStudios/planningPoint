// --- TYPES ---
// --- Internal ---
type TEnd = "!" | "?" | "..." | "." | ",";

type TOptions = {
  plural?: boolean;
  capitalize?: boolean;
  end?: TEnd;
};

// --- Export ---
export type TranslateFn = (key: string, options?: TOptions) => string;

// --- FUNCTIONS ---
// --- Internal ---
function applyEndPunctuation(value: string, end: TEnd, locale: string): string {
  switch (locale) {
    case "sv":
    case "en":
    // case "es":
    //   if (end === "!") return `¡${value}!`;
    default:
      return value + end;
  }
}

// --- Export ---
export function createTN(t: (key: string) => any, locale: string) {
  return function (key: string, options?: TOptions): string {
    let value: any;

    if (options?.plural === true) {
      value = t(`${key}.plural`);
    } else if (options?.plural === false) {
      value = t(`${key}.singular`);
    } else {
      value = t(key);
    }

    if (typeof value !== "string") {
      value = String(value ?? "");
    }

    if (options?.capitalize && value) {
      value = value[0].toUpperCase() + value.slice(1);
    }

    if (options?.end && value) {
      value = applyEndPunctuation(value, options.end, locale);
    }

    return value;
  };
}
