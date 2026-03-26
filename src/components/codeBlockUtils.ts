export type CodeBlockValue = string | object | null | undefined;

const stringifyObject = (value: object) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const normalizePlainCode = (code: CodeBlockValue) => {
  if (code === undefined || code === null) {
    return "";
  }

  if (typeof code === "string") {
    return code;
  }

  return stringifyObject(code);
};

export const normalizeJsonCode = (code: CodeBlockValue) => {
  if (code === undefined || code === null) {
    return "";
  }

  if (typeof code === "string") {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      return code;
    }
  }

  return stringifyObject(code);
};

export const normalizeCodeForLanguage = (
  code: CodeBlockValue,
  language = "json",
) => {
  if (language === "json") {
    return normalizeJsonCode(code);
  }

  return normalizePlainCode(code);
};

