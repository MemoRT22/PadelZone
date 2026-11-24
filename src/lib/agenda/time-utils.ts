export const TIMEZONE_CANCUN = "America/Cancun";
export const HOUR_HEIGHT_PX = 56;
export const AGENDA_START_HOUR = 7;
export const AGENDA_END_HOUR = 23;

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateISO(iso: string): Date {
  const parts = iso.split("-").map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString("es-MX", { weekday: "short" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function formatTimeRange(timeRange: string): { start: Date; end: Date } | null {
  const cleaned = timeRange.replace(/[\][")]/g, "");
  const parts = cleaned.split(",");
  if (parts.length < 2) return null;
  const startStr = parts[0]?.trim();
  const endStr = parts[1]?.trim();
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return { start, end };
}

export function formatTimeInCancun(date: Date): string {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE_CANCUN,
  });
}

export function buildTstzRange(start: Date, end: Date): string {
  return `[${start.toISOString()},${end.toISOString()})`;
}

export function buildDateTime(dateISO: string, hour: number): Date {
  const parts = dateISO.split("-").map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d, hour, 0, 0, 0);
}

export function getDurationHours(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

export function getHourFromTime(date: Date): number {
  const cancunStr = date.toLocaleString("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: TIMEZONE_CANCUN,
  });
  return parseInt(cancunStr, 10);
}

export function getMinuteFromTime(date: Date): number {
  const cancunStr = date.toLocaleString("en-US", {
    minute: "2-digit",
    timeZone: TIMEZONE_CANCUN,
  });
  return parseInt(cancunStr, 10);
}

export function getPositionFromTime(date: Date): { top: number; height: number } | null {
  const parsed = formatTimeRange(buildTstzRange(date, date));
  if (!parsed) return null;
  const startHour = getHourFromTime(date);
  const startMinute = getMinuteFromTime(date);
  const hourFraction = startMinute / 60;
  const top = (startHour - AGENDA_START_HOUR + hourFraction) * HOUR_HEIGHT_PX;
  return { top, height: HOUR_HEIGHT_PX };
}

export function getBookingPosition(
  timeRange: string
): { top: number; height: number } | null {
  const parsed = formatTimeRange(timeRange);
  if (!parsed) return null;

  const startHour = getHourFromTime(parsed.start);
  const startMinute = getMinuteFromTime(parsed.start);
  const endHour = getHourFromTime(parsed.end);
  const endMinute = getMinuteFromTime(parsed.end);

  const startTotalMin = startHour * 60 + startMinute;
  const endTotalMin = endHour * 60 + endMinute;
  const agendaStartMin = AGENDA_START_HOUR * 60;
  const agendaEndMin = AGENDA_END_HOUR * 60;

  const clampedStart = Math.max(startTotalMin, agendaStartMin);
  const clampedEnd = Math.min(endTotalMin, agendaEndMin);

  if (clampedEnd <= clampedStart) return null;

  const top = ((clampedStart - agendaStartMin) / 60) * HOUR_HEIGHT_PX;
  const height = ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT_PX;

  return { top: Math.max(0, top), height: Math.max(HOUR_HEIGHT_PX * 0.5, height) };
}

export function getHourLabels(): { hour: number; label: string }[] {
  const labels: { hour: number; label: string }[] = [];
  for (let h = AGENDA_START_HOUR; h <= AGENDA_END_HOUR; h++) {
    labels.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
    });
  }
  return labels;
}

export function getDurationOptions(): { value: number; label: string }[] {
  return [
    { value: 1, label: "1 hora" },
    { value: 2, label: "2 horas" },
    { value: 3, label: "3 horas" },
    { value: 4, label: "4 horas" },
  ];
}

export function getHourOptions(): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];
  for (let h = AGENDA_START_HOUR; h < AGENDA_END_HOUR; h++) {
    options.push({
      value: h,
      label: `${String(h).padStart(2, "0")}:00`,
    });
  }
  return options;
}
