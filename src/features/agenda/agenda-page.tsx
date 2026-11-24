import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  canManageReservations,
  canManageBlocks,
  canViewAgenda,
} from "@/lib/auth/permissions";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

import {
  formatDateISO,
  parseDateISO,
  formatDateDisplay,
  isToday,
  addDays,
  getHourLabels,
  getBookingPosition,
  formatTimeInCancun,
  formatTimeRange,
  HOUR_HEIGHT_PX,
  AGENDA_START_HOUR,
  AGENDA_END_HOUR,
} from "@/lib/agenda/time-utils";

import { BookingDialog, type BookingDialogMode } from "./booking-dialog";

type Court = Database["public"]["Tables"]["courts"]["Row"];
type CourtBooking = Database["public"]["Tables"]["court_bookings"]["Row"];

const TOTAL_HOURS = AGENDA_END_HOUR - AGENDA_START_HOUR;
const AGENDA_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT_PX;

export function AgendaPage() {
  const { membership } = useAuth();
  const { toast } = useToast();
  const role = membership?.role;

  const canReserve = canManageReservations(role);
  const canBlock = canManageBlocks(role);

  const [courts, setCourts] = React.useState<Court[]>([]);
  const [bookings, setBookings] = React.useState<CourtBooking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const now = new Date();
    return formatDateISO(now);
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<BookingDialogMode>("create-reservation");
  const [dialogDefaults, setDialogDefaults] = React.useState<{
    courtId?: string;
    startHour?: number;
  }>({});
  const [editingBooking, setEditingBooking] = React.useState<CourtBooking | null>(null);

  const activeCourts = React.useMemo(() => courts.filter((c) => c.active), [courts]);

  const loadData = React.useCallback(async (dateISO: string) => {
    setLoading(true);
    setError(null);

    const dayStart = parseDateISO(dateISO);
    dayStart.setHours(AGENDA_START_HOUR, 0, 0, 0);
    const dayEnd = parseDateISO(dateISO);
    dayEnd.setHours(AGENDA_END_HOUR, 0, 0, 0);

    const [courtsRes, bookingsRes] = await Promise.all([
      supabase.from("courts").select("*").order("number", { ascending: true }),
      supabase
        .from("court_bookings")
        .select("*")
        .overlaps("time_range", `[${dayStart.toISOString()},${dayEnd.toISOString()})`)
        .order("created_at", { ascending: false }),
    ]);

    if (courtsRes.error) {
      setError(courtsRes.error.message);
      setLoading(false);
      return;
    }
    if (bookingsRes.error) {
      setError(bookingsRes.error.message);
      setLoading(false);
      return;
    }

    setCourts((courtsRes.data ?? []) as Court[]);
    setBookings((bookingsRes.data ?? []) as CourtBooking[]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData(selectedDate);
  }, [loadData, selectedDate]);

  // Realtime subscription
  React.useEffect(() => {
    const channel = supabase
      .channel("court_bookings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "court_bookings" },
        () => {
          loadData(selectedDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, selectedDate]);

  function goToPrevDay() {
    setSelectedDate((prev) => {
      const d = parseDateISO(prev);
      return formatDateISO(addDays(d, -1));
    });
  }

  function goToNextDay() {
    setSelectedDate((prev) => {
      const d = parseDateISO(prev);
      return formatDateISO(addDays(d, 1));
    });
  }

  function goToToday() {
    setSelectedDate(formatDateISO(new Date()));
  }

  function openCreateReservation(courtId?: string, startHour?: number) {
    setEditingBooking(null);
    setDialogMode("create-reservation");
    setDialogDefaults({ courtId, startHour });
    setDialogOpen(true);
  }

  function openCreateBlock() {
    setEditingBooking(null);
    setDialogMode("create-block");
    setDialogDefaults({});
    setDialogOpen(true);
  }

  function openEditBooking(booking: CourtBooking) {
    setEditingBooking(booking);
    const parsed = formatTimeRange(booking.time_range);
    const startHour = parsed ? parseInt(parsed.start.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "America/Cancun" }), 10) : 9;
    setDialogMode(booking.booking_type === "bloqueo" ? "edit-block" : "edit-reservation");
    setDialogDefaults({
      courtId: booking.court_id,
      startHour,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(params: {
    courtId: string;
    timeRange: string;
    responsibleName: string | null;
    responsiblePhone: string | null;
    notes: string | null;
    bookingType: "reserva" | "bloqueo";
  }) {
    if (editingBooking) {
      const { error: updateErr } = await supabase
        .from("court_bookings")
        .update({
          court_id: params.courtId,
          time_range: params.timeRange,
          responsible_name: params.responsibleName,
          responsible_phone: params.responsiblePhone,
          notes: params.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingBooking.id);

      if (updateErr) {
        throw new Error(translateBookingError(updateErr.message));
      }
      toast({ title: params.bookingType === "bloqueo" ? "Bloqueo actualizado" : "Reserva actualizada", variant: "success" });
    } else {
      const { error: insertErr } = await supabase.from("court_bookings").insert({
        court_id: params.courtId,
        booking_type: params.bookingType,
        status: "activa",
        time_range: params.timeRange,
        responsible_name: params.responsibleName,
        responsible_phone: params.responsiblePhone,
        notes: params.notes,
      });

      if (insertErr) {
        throw new Error(translateBookingError(insertErr.message));
      }
      toast({
        title: params.bookingType === "bloqueo" ? "Bloqueo creado" : "Reserva creada",
        variant: "success",
      });
    }
    loadData(selectedDate);
  }

  async function cancelBooking(booking: CourtBooking) {
    const { error: cancelErr } = await supabase
      .from("court_bookings")
      .update({ status: "cancelada", updated_at: new Date().toISOString() })
      .eq("id", booking.id);

    if (cancelErr) {
      toast({
        title: "Error",
        description: translateBookingError(cancelErr.message),
        variant: "destructive",
      });
      return;
    }
    toast({
      title: booking.booking_type === "bloqueo" ? "Bloqueo cancelado" : "Reserva cancelada",
      variant: "success",
    });
    loadData(selectedDate);
  }

  if (!canViewAgenda(role)) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-sm text-muted-foreground">No tienes acceso a la agenda.</p>
      </div>
    );
  }

  const currentDate = parseDateISO(selectedDate);
  const hourLabels = getHourLabels();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zona5-navy">Agenda</h1>
          <p className="mt-0.5 text-sm text-muted-foreground capitalize">
            {formatDateDisplay(currentDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Day navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1 shadow-soft">
            <Button variant="ghost" size="icon" onClick={goToPrevDay} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className={cn(
                "h-8 px-3 text-xs font-semibold",
                isToday(currentDate) && "text-zona5-coral"
              )}
            >
              Hoy
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextDay} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {canReserve && (
            <Button
              onClick={() => openCreateReservation()}
              className="gap-2 bg-zona5-coral shadow-md shadow-zona5-coral/20 hover:bg-zona5-coralDark"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Reserva
            </Button>
          )}
          {canBlock && (
            <Button
              onClick={openCreateBlock}
              variant="outline"
              className="gap-2 border-zona5-navy/20 text-zona5-navy hover:bg-zona5-navy hover:text-white"
              size="sm"
            >
              <Ban className="h-4 w-4" />
              Bloqueo
            </Button>
          )}
        </div>
      </div>

      {/* Agenda grid */}
      {loading ? (
        <LoadingState message="Cargando agenda…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadData(selectedDate)} />
      ) : activeCourts.length === 0 ? (
        <EmptyState
          title="Sin canchas activas"
          description="No hay canchas habilitadas para reservar."
          icon={<CalendarDays className="h-6 w-6" />}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <div className="flex min-w-fit">
            {/* Time axis */}
            <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-border bg-card">
              <div className="h-10 border-b border-border" />
              {hourLabels.map((hl) => (
                <div
                  key={hl.hour}
                  className="relative text-right pr-2 text-[10px] font-medium text-muted-foreground"
                  style={{ height: HOUR_HEIGHT_PX }}
                >
                  <span className="absolute bottom-0 right-2">{hl.label}</span>
                </div>
              ))}
            </div>

            {/* Court lanes */}
            {activeCourts.map((court) => {
              const courtBookings = bookings.filter(
                (b) => b.court_id === court.id && b.status === "activa"
              );
              return (
                <CourtLane
                  key={court.id}
                  court={court}
                  bookings={courtBookings}
                  canReserve={canReserve}
                  canBlock={canBlock}
                  onSlotClick={(hour) => openCreateReservation(court.id, hour)}
                  onBookingClick={openEditBooking}
                  onCancelBooking={cancelBooking}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {!loading && !error && activeCourts.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-zona5-coral/80" />
            Reserva
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-zona5-navy/80" />
            Bloqueo
          </span>
        </div>
      )}

      {/* Dialog */}
      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        courts={activeCourts}
        defaultDateISO={selectedDate}
        defaultCourtId={dialogDefaults.courtId}
        defaultStartHour={dialogDefaults.startHour}
        canManageBlocks={canBlock}
        onSubmit={handleSubmit}
        initialData={editingBooking ? {
          courtId: editingBooking.court_id,
          startHour: dialogDefaults.startHour ?? 9,
          durationHours: editingBooking ? (() => {
            const parsed = formatTimeRange(editingBooking.time_range);
            if (!parsed) return 1;
            return Math.round((parsed.end.getTime() - parsed.start.getTime()) / (1000 * 60 * 60));
          })() : 1,
          responsibleName: editingBooking.responsible_name ?? "",
          responsiblePhone: editingBooking.responsible_phone ?? "",
          notes: editingBooking.notes ?? "",
          bookingType: editingBooking.booking_type,
        } : undefined}
      />
    </div>
  );
}

// ===== Court lane =====
function CourtLane({
  court,
  bookings,
  canReserve,
  canBlock,
  onSlotClick,
  onBookingClick,
  onCancelBooking,
}: {
  court: Court;
  bookings: CourtBooking[];
  canReserve: boolean;
  canBlock: boolean;
  onSlotClick: (hour: number) => void;
  onBookingClick: (booking: CourtBooking) => void;
  onCancelBooking: (booking: CourtBooking) => void;
}) {
  const [cancelConfirmId, setCancelConfirmId] = React.useState<string | null>(null);

  return (
    <div className="relative border-r border-border last:border-r-0" style={{ width: 140, minWidth: 140 }}>
      {/* Court header */}
      <div className="flex h-10 items-center justify-center border-b border-border bg-zona5-navy/[0.02]">
        <span className="text-xs font-bold text-zona5-navy">Cancha {court.number}</span>
      </div>

      {/* Time slots */}
      <div className="relative" style={{ height: AGENDA_HEIGHT }}>
        {/* Hour grid lines */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => i + AGENDA_START_HOUR).map((hour) => (
          <div
            key={hour}
            onClick={() => canReserve && onSlotClick(hour)}
            className={cn(
              "absolute left-0 right-0 border-b border-border",
              canReserve && "cursor-pointer transition-colors hover:bg-zona5-coral/[0.04]"
            )}
            style={{ top: (hour - AGENDA_START_HOUR) * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
          />
        ))}

        {/* Bookings */}
        {bookings.map((booking) => {
          const pos = getBookingPosition(booking.time_range);
          if (!pos) return null;
          const isBlock = booking.booking_type === "bloqueo";

          return (
            <div
              key={booking.id}
              className={cn(
                "absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 text-xs transition-all",
                isBlock
                  ? "bg-zona5-navy text-white"
                  : "bg-zona5-coral text-white",
                cancelConfirmId === booking.id && "ring-2 ring-destructive"
              )}
              style={{ top: pos.top, height: pos.height }}
            >
              <button
                onClick={() => onBookingClick(booking)}
                className="block w-full text-left"
              >
                <p className="font-bold leading-tight">
                  {isBlock ? "Bloqueo" : booking.responsible_name ?? "Reserva"}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] opacity-90">
                  <Clock className="h-2.5 w-2.5" />
                  {formatBookingTime(booking.time_range)}
                </p>
                {booking.notes && (
                  <p className="mt-0.5 truncate text-[10px] opacity-75">{booking.notes}</p>
                )}
              </button>

              {/* Cancel button */}
              {canReserve && !isBlock && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cancelConfirmId === booking.id) {
                      onCancelBooking(booking);
                      setCancelConfirmId(null);
                    } else {
                      setCancelConfirmId(booking.id);
                    }
                  }}
                  className="absolute right-1 top-1 rounded p-0.5 transition-colors hover:bg-white/20"
                  aria-label="Cancelar reserva"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
              {canBlock && isBlock && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cancelConfirmId === booking.id) {
                      onCancelBooking(booking);
                      setCancelConfirmId(null);
                    } else {
                      setCancelConfirmId(booking.id);
                    }
                  }}
                  className="absolute right-1 top-1 rounded p-0.5 transition-colors hover:bg-white/20"
                  aria-label="Cancelar bloqueo"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}

              {cancelConfirmId === booking.id && (
                <p className="mt-1 text-[10px] font-semibold underline">Click para confirmar</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatBookingTime(timeRange: string): string {
  const parsed = formatTimeRange(timeRange);
  if (!parsed) return "";
  return `${formatTimeInCancun(parsed.start)} - ${formatTimeInCancun(parsed.end)}`;
}

function translateBookingError(message: string): string {
  if (message.includes("court_bookings_no_overlap") || message.includes("exclusion constraint")) {
    return "Conflicto de horario: la cancha ya tiene una reserva o bloqueo activo en ese intervalo.";
  }
  if (message.includes("row-level security") || message.includes("RLS")) {
    return "No tienes permisos para realizar esta acción.";
  }
  return message;
}
