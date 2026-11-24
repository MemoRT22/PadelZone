import { isValidPhoneMX, normalizePhoneMX } from "@/lib/validation";
import {
  buildDateTime,
  buildTstzRange,
  AGENDA_START_HOUR,
  AGENDA_END_HOUR,
} from "./time-utils";

export interface ReservationFormData {
  courtId: string;
  dateISO: string;
  startHour: number;
  durationHours: number;
  responsibleName: string;
  responsiblePhone: string;
  notes: string;
}

export interface BlockFormData {
  courtId: string;
  dateISO: string;
  startHour: number;
  durationHours: number;
  notes: string;
}

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateReservationForm(data: ReservationFormData): ValidationResult {
  const name = data.responsibleName.trim();
  if (!name) {
    return { valid: false, error: "El nombre del responsable es obligatorio." };
  }
  if (name.length > 200) {
    return { valid: false, error: "El nombre no puede exceder 200 caracteres." };
  }
  if (data.responsiblePhone && !isValidPhoneMX(data.responsiblePhone)) {
    return { valid: false, error: "El teléfono debe tener 10 dígitos (formato México)." };
  }
  if (data.startHour < AGENDA_START_HOUR || data.startHour >= AGENDA_END_HOUR) {
    return { valid: false, error: `La hora de inicio debe estar entre ${AGENDA_START_HOUR}:00 y ${AGENDA_END_HOUR - 1}:00.` };
  }
  if (data.startHour + data.durationHours > AGENDA_END_HOUR) {
    return { valid: false, error: `La reserva excede el horario de operación (cierra a las ${AGENDA_END_HOUR}:00).` };
  }
  if (data.durationHours < 1 || data.durationHours > 4) {
    return { valid: false, error: "La duración debe ser entre 1 y 4 horas." };
  }
  return { valid: true, error: null };
}

export function validateBlockForm(data: BlockFormData): ValidationResult {
  if (data.startHour < AGENDA_START_HOUR || data.startHour >= AGENDA_END_HOUR) {
    return { valid: false, error: `La hora de inicio debe estar entre ${AGENDA_START_HOUR}:00 y ${AGENDA_END_HOUR - 1}:00.` };
  }
  if (data.startHour + data.durationHours > AGENDA_END_HOUR) {
    return { valid: false, error: `El bloqueo excede el horario de operación (cierra a las ${AGENDA_END_HOUR}:00).` };
  }
  if (data.durationHours < 1 || data.durationHours > 8) {
    return { valid: false, error: "La duración debe ser entre 1 y 8 horas." };
  }
  return { valid: true, error: null };
}

export function reservationToTstzRange(data: ReservationFormData): string {
  const start = buildDateTime(data.dateISO, data.startHour);
  const end = buildDateTime(data.dateISO, data.startHour + data.durationHours);
  return buildTstzRange(start, end);
}

export function blockToTstzRange(data: BlockFormData): string {
  const start = buildDateTime(data.dateISO, data.startHour);
  const end = buildDateTime(data.dateISO, data.startHour + data.durationHours);
  return buildTstzRange(start, end);
}

export function normalizePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  return normalizePhoneMX(trimmed);
}
