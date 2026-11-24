export function normalizePhoneMX(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+52")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("52") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.startsWith("044") || cleaned.startsWith("045")) {
    cleaned = cleaned.slice(3);
  }
  return cleaned;
}

export function isValidPhoneMX(phone: string): boolean {
  if (!phone || phone.trim().length === 0) return true;
  const normalized = normalizePhoneMX(phone);
  return /^\d{10}$/.test(normalized);
}

export function formatPhoneMX(phone: string | null): string {
  if (!phone) return "";
  const normalized = normalizePhoneMX(phone);
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }
  return phone;
}

export function pesosToCents(pesos: string | number): number {
  const value = typeof pesos === "string" ? parseFloat(pesos) : pesos;
  if (isNaN(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function centsToPesos(cents: number): string {
  const pesos = cents / 100;
  return pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isValidPrice(pesos: string | number): boolean {
  const value = typeof pesos === "string" ? parseFloat(pesos) : pesos;
  if (isNaN(value) || value < 0) return false;
  return value <= 999999.99;
}

export function isNonEmptyTrimmed(value: string): boolean {
  return value.trim().length > 0;
}

export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}
