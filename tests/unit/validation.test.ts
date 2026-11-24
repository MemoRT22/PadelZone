import { describe, it, expect } from "vitest";
import {
  normalizePhoneMX,
  isValidPhoneMX,
  formatPhoneMX,
  pesosToCents,
  centsToPesos,
  isValidPrice,
  isNonEmptyTrimmed,
  truncateText,
} from "@/lib/validation";

describe("normalizePhoneMX", () => {
  it("removes spaces and dashes", () => {
    expect(normalizePhoneMX("555 123 4567")).toBe("5551234567");
    expect(normalizePhoneMX("555-123-4567")).toBe("5551234567");
  });

  it("strips +52 prefix", () => {
    expect(normalizePhoneMX("+525551234567")).toBe("5551234567");
  });

  it("strips 52 prefix on 12-digit numbers", () => {
    expect(normalizePhoneMX("525551234567")).toBe("5551234567");
  });

  it("strips 044/045 prefixes", () => {
    expect(normalizePhoneMX("0445551234567")).toBe("5551234567");
    expect(normalizePhoneMX("0455551234567")).toBe("5551234567");
  });
});

describe("isValidPhoneMX", () => {
  it("accepts empty phone (optional)", () => {
    expect(isValidPhoneMX("")).toBe(true);
    expect(isValidPhoneMX("  ")).toBe(true);
  });

  it("accepts valid 10-digit numbers", () => {
    expect(isValidPhoneMX("5551234567")).toBe(true);
    expect(isValidPhoneMX("+52 555 123 4567")).toBe(true);
  });

  it("rejects invalid phones", () => {
    expect(isValidPhoneMX("123")).toBe(false);
    expect(isValidPhoneMX("abcdefghij")).toBe(false);
    expect(isValidPhoneMX("5551234567890")).toBe(false);
  });
});

describe("formatPhoneMX", () => {
  it("formats 10-digit phone with spaces", () => {
    expect(formatPhoneMX("5551234567")).toBe("555 123 4567");
  });

  it("returns empty for null", () => {
    expect(formatPhoneMX(null)).toBe("");
  });

  it("returns original if not 10 digits", () => {
    expect(formatPhoneMX("123")).toBe("123");
  });
});

describe("pesosToCents / centsToPesos", () => {
  it("converts pesos to cents correctly", () => {
    expect(pesosToCents("100")).toBe(10000);
    expect(pesosToCents("99.99")).toBe(9999);
    expect(pesosToCents("0.01")).toBe(1);
    expect(pesosToCents(50.5)).toBe(5050);
  });

  it("handles invalid values", () => {
    expect(pesosToCents("abc")).toBe(0);
    expect(pesosToCents(-10)).toBe(0);
  });

  it("converts cents to pesos display string", () => {
    expect(centsToPesos(10000)).toBe("100.00");
    expect(centsToPesos(9999)).toBe("99.99");
    expect(centsToPesos(1)).toBe("0.01");
  });
});

describe("isValidPrice", () => {
  it("accepts valid positive prices", () => {
    expect(isValidPrice("100")).toBe(true);
    expect(isValidPrice("0")).toBe(true);
    expect(isValidPrice("999.99")).toBe(true);
  });

  it("rejects negative or too large", () => {
    expect(isValidPrice("-1")).toBe(false);
    expect(isValidPrice("1000000")).toBe(false);
  });

  it("rejects non-numeric", () => {
    expect(isValidPrice("abc")).toBe(false);
  });
});

describe("isNonEmptyTrimmed", () => {
  it("accepts non-empty strings", () => {
    expect(isNonEmptyTrimmed("hello")).toBe(true);
    expect(isNonEmptyTrimmed(" hello ")).toBe(true);
  });

  it("rejects empty or whitespace", () => {
    expect(isNonEmptyTrimmed("")).toBe(false);
    expect(isNonEmptyTrimmed("   ")).toBe(false);
  });
});

describe("truncateText", () => {
  it("keeps short text as-is", () => {
    expect(truncateText("hola", 10)).toBe("hola");
  });

  it("truncates long text with ellipsis", () => {
    expect(truncateText("hola mundo cruel", 8)).toBe("hola mu…");
  });
});
