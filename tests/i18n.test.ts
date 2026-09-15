import { describe, expect, it } from "vitest";
import {
  COMPONENT_I18N_KEYS,
  getDict,
  LOCALES,
  t,
} from "../lib/i18n/dict";
import { pathForLocale } from "../lib/i18n/locale-shared";

describe("shared component translations", () => {
  it.each(LOCALES)("has direct, non-empty values for every new key in %s", (locale) => {
    const dict = getDict(locale);

    for (const key of COMPONENT_I18N_KEYS) {
      expect(dict).toHaveProperty(key);
      expect(dict[key].trim()).not.toBe("");
      expect(t(locale, key)).not.toBe(key);
    }
  });

  it("does not mistake the zh-Hant fallback for a completed English translation", () => {
    const zh = getDict("zh-Hant");
    const en = getDict("en");

    for (const key of COMPONENT_I18N_KEYS) {
      expect(en[key]).toBeDefined();
      expect(en[key]).not.toBe(zh[key]);
    }
  });
});

describe("pathForLocale", () => {
  it("maps all four localized route categories", () => {
    expect(pathForLocale("en", "/")).toBe("/en");
    expect(pathForLocale("en", "/check")).toBe("/en/check");
    expect(pathForLocale("en", "/disclaimer")).toBe("/en/disclaimer");
    expect(pathForLocale("en", "/templates/lease")).toBe("/en/templates/lease");
  });

  it("keeps functional routes unprefixed", () => {
    expect(pathForLocale("en", "/contracts/new?tpl=lease")).toBe("/contracts/new?tpl=lease");
    expect(pathForLocale("en", "/checkout#plans")).toBe("/checkout#plans");
    expect(pathForLocale("en", "/settings")).toBe("/settings");
    expect(pathForLocale("en", "/cases/abc")).toBe("/cases/abc");
  });

  it("preserves query strings and hashes on localized template links", () => {
    expect(pathForLocale("en", "/templates/lease?from=home#legal")).toBe(
      "/en/templates/lease?from=home#legal",
    );
    expect(pathForLocale("zh-Hant", "/en/templates/lease?from=home#legal")).toBe(
      "/templates/lease?from=home#legal",
    );
  });
});
