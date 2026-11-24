import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validateReservationForm,
  validateBlockForm,
  reservationToTstzRange,
  blockToTstzRange,
  normalizePhone,
  type ReservationFormData,
  type BlockFormData,
} from "@/lib/agenda/validation";
import { getHourOptions, getDurationOptions } from "@/lib/agenda/time-utils";
import type { Database } from "@/types/database";
type Court = Database["public"]["Tables"]["courts"]["Row"];

export type BookingDialogMode = "create-reservation" | "create-block" | "edit-reservation" | "edit-block";

export interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: BookingDialogMode;
  courts: Court[];
  defaultDateISO: string;
  defaultCourtId?: string;
  defaultStartHour?: number;
  canManageBlocks: boolean;
  onSubmit: (params: {
    courtId: string;
    timeRange: string;
    responsibleName: string | null;
    responsiblePhone: string | null;
    notes: string | null;
    bookingType: "reserva" | "bloqueo";
  }) => Promise<void>;
  initialData?: {
    courtId: string;
    startHour: number;
    durationHours: number;
    responsibleName: string;
    responsiblePhone: string;
    notes: string;
    bookingType: "reserva" | "bloqueo";
  };
}

export function BookingDialog({
  open,
  onOpenChange,
  mode,
  courts,
  defaultDateISO,
  defaultCourtId,
  defaultStartHour,
  onSubmit,
  initialData,
}: BookingDialogProps) {
  const isBlock = mode === "create-block" || mode === "edit-block";
  const isEdit = mode === "edit-reservation" || mode === "edit-block";

  const hourOptions = getHourOptions();
  const durationOptions = isBlock
    ? [
        { value: 1, label: "1 hora" },
        { value: 2, label: "2 horas" },
        { value: 3, label: "3 horas" },
        { value: 4, label: "4 horas" },
        { value: 6, label: "6 horas" },
        { value: 8, label: "8 horas" },
      ]
    : getDurationOptions();

  const [dateISO, setDateISO] = React.useState(defaultDateISO);
  const [courtId, setCourtId] = React.useState(defaultCourtId ?? courts[0]?.id ?? "");
  const [startHour, setStartHour] = React.useState(defaultStartHour ?? hourOptions[0]?.value ?? 7);
  const [duration, setDuration] = React.useState(1);
  const [responsibleName, setResponsibleName] = React.useState("");
  const [responsiblePhone, setResponsiblePhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setCourtId(initialData.courtId);
        setStartHour(initialData.startHour);
        setDuration(initialData.durationHours);
        setResponsibleName(initialData.responsibleName);
        setResponsiblePhone(initialData.responsiblePhone);
        setNotes(initialData.notes);
      } else {
        setDateISO(defaultDateISO);
        setCourtId(defaultCourtId ?? courts[0]?.id ?? "");
        setStartHour(defaultStartHour ?? hourOptions[0]?.value ?? 7);
        setDuration(1);
        setResponsibleName("");
        setResponsiblePhone("");
        setNotes("");
      }
      setFormError(null);
    }
  }, [open, initialData, defaultDateISO, defaultCourtId, defaultStartHour, courts, hourOptions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (isBlock) {
      const data: BlockFormData = { courtId, dateISO, startHour, durationHours: duration, notes };
      const result = validateBlockForm(data);
      if (!result.valid) {
        setFormError(result.error);
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit({
          courtId,
          timeRange: blockToTstzRange(data),
          responsibleName: null,
          responsiblePhone: null,
          notes: notes.trim() || null,
          bookingType: "bloqueo",
        });
        onOpenChange(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Error al guardar.");
      } finally {
        setSubmitting(false);
      }
    } else {
      const data: ReservationFormData = {
        courtId,
        dateISO,
        startHour,
        durationHours: duration,
        responsibleName,
        responsiblePhone,
        notes,
      };
      const result = validateReservationForm(data);
      if (!result.valid) {
        setFormError(result.error);
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit({
          courtId,
          timeRange: reservationToTstzRange(data),
          responsibleName: responsibleName.trim(),
          responsiblePhone: normalizePhone(responsiblePhone),
          notes: notes.trim() || null,
          bookingType: "reserva",
        });
        onOpenChange(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Error al guardar.");
      } finally {
        setSubmitting(false);
      }
    }
  }

  const title = isEdit
    ? isBlock ? "Editar bloqueo" : "Editar reserva"
    : isBlock ? "Nuevo bloqueo" : "Nueva reserva";

  const description = isBlock
    ? "Bloquea una cancha temporalmente (mantenimiento, evento, etc.)."
    : "Reserva una cancha para un responsable.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-court">Cancha *</Label>
            <Select value={courtId} onValueChange={setCourtId}>
              <SelectTrigger id="booking-court">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="booking-date">Fecha *</Label>
              <Input
                id="booking-date"
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-start">Hora de inicio *</Label>
              <Select
                value={String(startHour)}
                onValueChange={(v) => setStartHour(Number(v))}
              >
                <SelectTrigger id="booking-start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-duration">Duración *</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
            >
              <SelectTrigger id="booking-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isBlock && (
            <>
              <div className="space-y-2">
                <Label htmlFor="booking-name">Responsable *</Label>
                <Input
                  id="booking-name"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  disabled={submitting}
                  required
                  maxLength={200}
                  placeholder="Nombre de quien reserva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-phone">Teléfono</Label>
                <Input
                  id="booking-phone"
                  type="tel"
                  value={responsiblePhone}
                  onChange={(e) => setResponsiblePhone(e.target.value)}
                  disabled={submitting}
                  maxLength={20}
                  placeholder="10 dígitos (opcional)"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="booking-notes">Notas</Label>
            <Input
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              maxLength={500}
              placeholder={isBlock ? "Motivo del bloqueo" : "Notas internas (opcional)"}
            />
          </div>

          {formError && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
