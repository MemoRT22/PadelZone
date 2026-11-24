import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { canManageCourts } from "@/lib/auth/permissions";
import { Plus, Power, ChevronLeft, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Court = Database["public"]["Tables"]["courts"]["Row"];

export function CourtsPage() {
  const { membership } = useAuth();
  const { toast } = useToast();
  const role = membership?.role;
  const canManage = canManageCourts(role);

  const [courts, setCourts] = React.useState<Court[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const loadCourts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("courts")
      .select("*")
      .order("number", { ascending: true });

    if (qErr) {
      setError(qErr.message);
    } else {
      setCourts((data ?? []) as Court[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadCourts();
  }, [loadCourts]);

  const selectedCourt = courts.find((c) => c.id === selectedId) ?? null;

  const activeCount = courts.filter((c) => c.active).length;
  const inactiveCount = courts.length - activeCount;

  async function toggleActive(court: Court) {
    setTogglingId(court.id);
    const { error: updateErr } = await supabase
      .from("courts")
      .update({ active: !court.active })
      .eq("id", court.id);

    setTogglingId(null);

    if (updateErr) {
      toast({
        title: "Error",
        description: updateErr.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: court.active ? "Cancha desactivada" : "Cancha activada",
      variant: "success",
    });
    loadCourts();
  }

  async function addCourt() {
    const nextNumber = courts.length > 0 ? Math.max(...courts.map((c) => c.number)) + 1 : 1;
    setSubmitting(true);

    const { data, error: insertErr } = await supabase
      .from("courts")
      .insert({
        name: `Cancha ${nextNumber}`,
        number: nextNumber,
        sort_order: nextNumber,
        active: true,
      })
      .select()
      .single();

    setSubmitting(false);

    if (insertErr) {
      toast({
        title: "Error al crear cancha",
        description: insertErr.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: `Cancha ${nextNumber} creada`, variant: "success" });
    await loadCourts();
    if (data) setSelectedId((data as Court).id);
  }

  // Keyboard navigation
  React.useEffect(() => {
    if (loading || courts.length === 0) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = selectedId
          ? courts.findIndex((c) => c.id === selectedId)
          : -1;
        if (e.key === "ArrowDown") {
          const next = currentIndex < courts.length - 1 ? currentIndex + 1 : 0;
          setSelectedId(courts[next]?.id ?? courts[0]?.id ?? null);
        } else {
          const prev = currentIndex > 0 ? currentIndex - 1 : courts.length - 1;
          setSelectedId(courts[prev]?.id ?? courts[0]?.id ?? null);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [loading, courts, selectedId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          activeCount={0}
          inactiveCount={0}
          total={0}
          canManage={canManage}
          onAdd={addCourt}
          submitting={submitting}
        />
        <LoadingState message="Cargando canchas…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          activeCount={0}
          inactiveCount={0}
          total={0}
          canManage={canManage}
          onAdd={addCourt}
          submitting={submitting}
        />
        <ErrorState message={error} onRetry={loadCourts} />
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          activeCount={0}
          inactiveCount={0}
          total={0}
          canManage={canManage}
          onAdd={addCourt}
          submitting={submitting}
        />
        <EmptyState
          title="Sin canchas configuradas"
          description="Agrega la primera cancha del club."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        total={courts.length}
        canManage={canManage}
        onAdd={addCourt}
        submitting={submitting}
      />

      {/* Court Deck — desktop: split view, mobile: list or detail */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Court list — unified navy surface */}
        <div
          ref={listRef}
          className="overflow-hidden rounded-2xl bg-zona5-navy shadow-lift lg:min-h-[460px]"
        >
          {/* Section label */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zona5-cream/30">
              Canchas del club
            </span>
            <span className="text-[10px] font-medium text-zona5-cream/25">
              {courts.length} en total
            </span>
          </div>

          {/* Court rows */}
          <div className="px-2 pb-2">
            {courts.map((court, idx) => (
              <CourtRow
                key={court.id}
                court={court}
                selected={court.id === selectedId}
                onSelect={() => setSelectedId(court.id)}
                isLast={idx === courts.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Detail panel — desktop */}
        <div className="hidden lg:block">
          {selectedCourt ? (
            <CourtDetailPanel
              key={selectedCourt.id}
              court={selectedCourt}
              canManage={canManage}
              toggling={togglingId === selectedCourt.id}
              onToggle={() => toggleActive(selectedCourt)}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <EmptyDetailPanel total={courts.length} active={activeCount} inactive={inactiveCount} />
          )}
        </div>
      </div>

      {/* Detail panel — mobile overlay */}
      {selectedCourt && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-zona5-navy/70 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-zona5-warm panel-slide-up max-h-[85vh] overflow-y-auto">
            <CourtDetailPanel
              court={selectedCourt}
              canManage={canManage}
              toggling={togglingId === selectedCourt.id}
              onToggle={() => toggleActive(selectedCourt)}
              onClose={() => setSelectedId(null)}
              isMobile
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Page header =====
function PageHeader({
  activeCount,
  inactiveCount,
  total,
  canManage,
  onAdd,
  submitting,
}: {
  activeCount: number;
  inactiveCount: number;
  total: number;
  canManage: boolean;
  onAdd: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zona5-navy">
          Centro de Canchas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitoreo y control operativo
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Metric label="Operativas" value={activeCount} color="green" />
          <Divider />
          <Metric label="Inactivas" value={inactiveCount} color="muted" />
          <Divider />
          <Metric label="Total" value={total} color="navy" />
        </div>
        {canManage && (
          <Button
            onClick={onAdd}
            disabled={submitting}
            className="gap-2 bg-zona5-coral shadow-md shadow-zona5-coral/20 hover:bg-zona5-coralDark"
          >
            <Plus className="h-4 w-4" />
            {submitting ? "Creando…" : "Agregar"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: "green" | "muted" | "navy" }) {
  const valueColor = {
    green: "text-zona5-green",
    muted: "text-muted-foreground",
    navy: "text-zona5-navy",
  }[color];
  return (
    <div className="text-right">
      <p className={cn("text-xl font-bold leading-none", valueColor)}>{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Divider() {
  return <span className="h-7 w-px bg-border" />;
}

// ===== Court row (in the navy list) =====
function CourtRow({
  court,
  selected,
  onSelect,
  isLast,
}: {
  court: Court;
  selected: boolean;
  onSelect: () => void;
  isLast: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-all duration-200",
        selected ? "bg-zona5-coral/15" : "hover:bg-white/[0.04]",
        !isLast && "mb-0.5"
      )}
    >
      {/* Number */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-black transition-colors",
          selected
            ? "bg-zona5-coral text-white"
            : court.active
            ? "bg-white/[0.06] text-zona5-cream/70 group-hover:text-white"
            : "bg-white/[0.02] text-zona5-cream/20"
        )}
      >
        {court.number}
      </div>

      {/* Name + status */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold transition-colors",
            selected ? "text-white" : court.active ? "text-zona5-cream/80" : "text-zona5-cream/30"
          )}
        >
          {court.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              court.active ? "bg-zona5-green status-dot-active" : "bg-zona5-cream/15"
            )}
          />
          <span
            className={cn(
              "text-[11px] font-medium",
              court.active ? "text-zona5-greenSoft" : "text-zona5-cream/25"
            )}
          >
            {court.active ? "Operativa" : "Inactiva"}
          </span>
        </div>
      </div>

      {/* Selection chevron */}
      <ChevronLeft
        className={cn(
          "h-4 w-4 shrink-0 rotate-180 transition-all duration-200",
          selected ? "text-zona5-coral opacity-100" : "text-zona5-cream/20 opacity-0 group-hover:opacity-40"
        )}
      />
    </button>
  );
}

// ===== Detail panel =====
function CourtDetailPanel({
  court,
  canManage,
  toggling,
  onToggle,
  onClose,
  isMobile = false,
}: {
  court: Court;
  canManage: boolean;
  toggling: boolean;
  onToggle: () => void;
  onClose: () => void;
  isMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-card",
        isMobile ? "p-5" : "panel-slide-in h-full p-6"
      )}
    >
      {/* Close button */}
      {isMobile && (
        <button
          onClick={onClose}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </button>
      )}

      {/* Court number — oversized */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Cancha
          </p>
          <p className="mt-1 text-6xl font-black leading-none text-zona5-navy">
            {court.number}
          </p>
        </div>
        <button
          onClick={onClose}
          className="hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:block"
          aria-label="Cerrar panel"
        >
          <ChevronLeft className="h-5 w-5 rotate-90" />
        </button>
      </div>

      {/* Status badge */}
      <div className="mt-5 flex items-center gap-2.5">
        <span
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
            court.active
              ? "bg-zona5-green/10 text-zona5-green"
              : "bg-muted text-muted-foreground"
          )}
        >
          <CircleDot className="h-3.5 w-3.5" />
          {court.active ? "Operativa" : "Inactiva"}
        </span>
      </div>

      {/* Meta grid */}
      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <MetaRow label="Identificador" value={court.name} />
        <MetaRow label="Numero" value={String(court.number)} />
        <MetaRow
          label="Estado administrativo"
          value={court.active ? "Habilitada" : "Deshabilitada"}
        />
      </div>

      {/* Future-ready section placeholder — no fake data */}
      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Proximamente
        </p>
        <p className="mt-1 text-sm text-muted-foreground/50">
          Disponibilidad, reservas y ocupacion por horario
        </p>
      </div>

      {/* Action */}
      {canManage && (
        <div className="mt-6 border-t border-border pt-5">
          <Button
            variant={court.active ? "outline" : "default"}
            disabled={toggling}
            onClick={onToggle}
            className={cn(
              "w-full gap-2 transition-all",
              court.active
                ? "border-zona5-navy/20 text-zona5-navy hover:bg-zona5-navy hover:text-white"
                : "bg-zona5-green text-white hover:bg-zona5-greenDark"
            )}
          >
            <Power className="h-4 w-4" />
            {toggling
              ? "Procesando…"
              : court.active
              ? "Desactivar cancha"
              : "Activar cancha"}
          </Button>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-zona5-navy">{value}</span>
    </div>
  );
}

// ===== Empty detail (no selection) =====
function EmptyDetailPanel({
  total,
  active,
  inactive,
}: {
  total: number;
  active: number;
  inactive: number;
}) {
  return (
    <div className="flex h-full min-h-[460px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zona5-navy/[0.04]">
        <RectangleHorizontalPlaceholder />
      </div>
      <p className="text-sm font-semibold text-zona5-navy">Selecciona una cancha</p>
      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
        Usa el teclado o toca una cancha para ver su detalle y acciones
      </p>
      <div className="mt-5 flex gap-4">
        <span className="text-xs text-muted-foreground">
          <strong className="text-zona5-green">{active}</strong> operativas
        </span>
        <span className="text-xs text-muted-foreground">
          <strong className="text-muted-foreground">{inactive}</strong> inactivas
        </span>
        <span className="text-xs text-muted-foreground">
          <strong className="text-zona5-navy">{total}</strong> total
        </span>
      </div>
    </div>
  );
}

function RectangleHorizontalPlaceholder() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-zona5-navy/15">
      <rect x="4" y="8" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="16" y1="8" x2="16" y2="24" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}
