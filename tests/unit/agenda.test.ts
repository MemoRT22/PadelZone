import { describe, it, expect } from "vitest";
import {
  validateReservationForm,
  validateBlockForm,
  reservationToTstzRange,
  blockToTstzRange,
} from "@/lib/agenda/validation";
import {
  buildDateTime,
  buildTstzRange,
  formatTimeRange,
  formatDateISO,
  parseDateISO,
  addDays,
  isToday,
  isSameDay,
  getHourLabels,
  AGENDA_START_HOUR,
  AGENDA_END_HOUR,
} from "@/lib/agenda/time-utils";

describe("agenda time utilities", () => {
  it("formatDateISO produces YYYY-MM-DD", () => {
    const date = new Date(2026, 0, 5);
    expect(formatDateISO(date)).toBe("2026-01-05");
  });

  it("parseDateISO roundtrips", () => {
    const iso = "2026-03-15";
    const date = parseDateISO(iso);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
  });

  it("addDays moves forward and backward", () => {
    const base = new Date(2026, 5, 10);
    expect(addDays(base, 1).getDate()).toBe(11);
    expect(addDays(base, -5).getDate()).toBe(5);
  });

  it("isToday returns true for now", () => {
    expect(isToday(new Date())).toBe(true);
  });

  it("isSameDay compares correctly", () => {
    const a = new Date(2026, 0, 1, 10, 0);
    const b = new Date(2026, 0, 1, 22, 0);
    const c = new Date(2026, 0, 2);
    expect(isSameDay(a, b)).toBe(true);
    expect(isSameDay(a, c)).toBe(false);
  });

  it("buildDateTime creates correct local time", () => {
    const dt = buildDateTime("2026-06-15", 14);
    expect(dt.getFullYear()).toBe(2026);
    expect(dt.getMonth()).toBe(5);
    expect(dt.getDate()).toBe(15);
    expect(dt.getHours()).toBe(14);
  });

  it("buildTstzRange creates valid ISO range string", () => {
    const start = buildDateTime("2026-06-15", 10);
    const end = buildDateTime("2026-06-15", 11);
    const range = buildTstzRange(start, end);
    expect(range.startsWith("[")).toBe(true);
    expect(range.endsWith(")")).toBe(true);
    expect(range).toContain(",");
  });

  it("formatTimeRange parses tstzrange", () => {
    const start = buildDateTime("2026-06-15", 10);
    const end = buildDateTime("2026-06-15", 12);
    const range = buildTstzRange(start, end);
    const parsed = formatTimeRange(range);
    expect(parsed).not.toBeNull();
    expect(parsed!.start.getTime()).toBe(start.getTime());
    expect(parsed!.end.getTime()).toBe(end.getTime());
  });

  it("getHourLabels covers full range", () => {
    const labels = getHourLabels();
    expect(labels[0].hour).toBe(AGENDA_START_HOUR);
    expect(labels[labels.length - 1].hour).toBe(AGENDA_END_HOUR);
    expect(labels.length).toBe(AGENDA_END_HOUR - AGENDA_START_HOUR + 1);
  });
});

describe("reservation validation", () => {
  const validData = {
    courtId: "court-uuid",
    dateISO: "2026-06-15",
    startHour: 10,
    durationHours: 1,
    responsibleName: "Juan Perez",
    responsiblePhone: "",
    notes: "",
  };

  it("accepts valid reservation data", () => {
    const result = validateReservationForm(validData);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("rejects empty responsible name", () => {
    const result = validateReservationForm({ ...validData, responsibleName: "  " });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("responsable");
  });

  it("rejects invalid phone", () => {
    const result = validateReservationForm({ ...validData, responsiblePhone: "123" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("teléfono");
  });

  it("rejects start hour outside range", () => {
    const result = validateReservationForm({ ...validData, startHour: 5 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("hora de inicio");
  });

  it("rejects duration exceeding closing time", () => {
    const result = validateReservationForm({ ...validData, startHour: 22, durationHours: 2 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("horario");
  });

  it("accepts valid phone (10 digits)", () => {
    const result = validateReservationForm({ ...validData, responsiblePhone: "9981234567" });
    expect(result.valid).toBe(true);
  });

  it("rejects duration > 4", () => {
    const result = validateReservationForm({ ...validData, durationHours: 5 });
    expect(result.valid).toBe(false);
  });
});

describe("block validation", () => {
  const validData = {
    courtId: "court-uuid",
    dateISO: "2026-06-15",
    startHour: 9,
    durationHours: 2,
    notes: "Mantenimiento",
  };

  it("accepts valid block data", () => {
    const result = validateBlockForm(validData);
    expect(result.valid).toBe(true);
  });

  it("rejects block exceeding hours", () => {
    const result = validateBlockForm({ ...validData, durationHours: 9 });
    expect(result.valid).toBe(false);
  });

  it("allows up to 8 hours for blocks", () => {
    const result = validateBlockForm({ ...validData, startHour: 8, durationHours: 8 });
    expect(result.valid).toBe(true);
  });
});

describe("tstzrange conversion", () => {
  it("reservationToTstzRange produces valid range", () => {
    const range = reservationToTstzRange({
      courtId: "x",
      dateISO: "2026-06-15",
      startHour: 10,
      durationHours: 2,
      responsibleName: "Test",
      responsiblePhone: "",
      notes: "",
    });
    const parsed = formatTimeRange(range);
    expect(parsed).not.toBeNull();
    const durationMs = parsed!.end.getTime() - parsed!.start.getTime();
    expect(durationMs).toBe(2 * 60 * 60 * 1000);
  });

  it("blockToTstzRange produces valid range", () => {
    const range = blockToTstzRange({
      courtId: "x",
      dateISO: "2026-06-15",
      startHour: 14,
      durationHours: 3,
      notes: "",
    });
    const parsed = formatTimeRange(range);
    expect(parsed).not.toBeNull();
  });
});
