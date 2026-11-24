import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { canManageCourts } from "@/lib/auth/permissions";
import { Plus, Power, Activity } from "lucide-react";
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

    const { error: insertErr } = await supabase.from("courts").insert({
      name: `Cancha ${nextNumber}`,
      number: nextNumber,
      sort_order: nextNumber,
      active: true,
    });

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
    loadCourts();
  }

  const activeCount = courts.filter((c) => c.active).length;
  const inactiveCount = courts.length - activeCount;
  const totalCourts = courts.length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zona5-navy">Centro de Canchas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoreo y control operativo de las canchas del club
          </p>
        </div>
        {canManage && (
          <Button
            onClick={addCourt}
            disabled={submitting}
            className="gap-2 bg-zona5-coral shadow-md shadow-zona5-coral/20 hover:bg-zona5-coralDark"
          >
            <Plus className="h-4 w-4" />
            {submitting ? "Creando…" : "Agregar cancha"}
          </Button>
        )}
      </div>

      {/* Status strip */}
      {!loading && !error && totalCourts > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusTile
            label="Total"
            value={totalCourts}
            accent="navy"
          />
          <StatusTile
            label="Operativas"
            value={activeCount}
            accent="green"
          />
          <StatusTile
            label="Inactivas"
            value={inactiveCount}
            accent="muted"
          />
          <StatusTile
            label="Estado general"
            value={activeCount === 0 ? "Detenido" : activeCount === totalCourts ? "Optimo" : "Parcial"}
            accent={activeCount === totalCourts ? "green" : activeCount === 0 ? "muted" : "gold"}
            isText
          />
        </div>
      )}

      {/* Court panels */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCourts} />
      ) : courts.length === 0 ? (
        <EmptyState
          title="Sin canchas configuradas"
          description="Agrega la primera cancha del club."
        />
      ) : (
        <div className="space-y-3">
          {courts.map((court) => (
            <CourtPanel
              key={court.id}
              court={court}
              canManage={canManage}
              toggling={togglingId === court.id}
              onToggle={() => toggleActive(court)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusTile({
  label,
  value,
  accent,
  isText = false,
}: {
  label: string;
  value: number | string;
  accent: "navy" | "green" | "gold" | "muted";
  isText?: boolean;
}) {
  const accentStyles: Record<typeof accent, string> = {
    navy: "border-l-zona5-navy",
    green: "border-l-zona5-green",
    gold: "border-l-zona5-gold",
    muted: "border-l-zona5-navy/20",
  };

  const valueColor: Record<typeof accent, string> = {
    navy: "text-zona5-navy",
    green: "text-zona5-green",
    gold: "text-zona5-gold",
    muted: "text-muted-foreground",
  };

  return (
    <div
      className={`rounded-xl border border-border border-l-4 ${accentStyles[accent]} bg-card px-4 py-3 shadow-soft`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 ${isText ? "text-lg font-bold" : "text-2xl font-bold"} ${valueColor[accent]}`}>
        {value}
      </p>
    </div>
  );
}

function CourtPanel({
  court,
  canManage,
  toggling,
  onToggle,
}: {
  court: Court;
  canManage: boolean;
  toggling: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft
        transition-all duration-300 hover:shadow-lift
        ${!court.active ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-stretch">
        {/* Number slab */}
        <div
          className={`
            relative flex w-20 shrink-0 flex-col items-center justify-center
            sm:w-24
            ${court.active ? "bg-zona5-navy" : "bg-zona5-navy/30"}
          `}
        >
          <span
            className={`text-3xl font-black tracking-tight sm:text-4xl ${
              court.active ? "text-zona5-coral" : "text-zona5-cream/40"
            }`}
          >
            {court.number}
          </span>
          <span
            className={`mt-0.5 text-[10px] font-medium uppercase tracking-widest ${
              court.active ? "text-zona5-cream/50" : "text-zona5-cream/20"
            }`}
          >
            Cancha
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {/* Left: name + status */}
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2.5">
              <span
                className={`
                  relative flex h-2.5 w-2.5 rounded-full
                  ${court.active ? "bg-zona5-green status-dot-active" : "bg-muted-foreground/30"}
                `}
              />
              <div>
                <p className="text-sm font-bold text-zona5-navy">
                  {court.name}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  {court.active ? "Operativa" : "Fuera de servicio"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: action */}
          {canManage && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant={court.active ? "outline" : "default"}
                size="sm"
                disabled={toggling}
                onClick={onToggle}
                className={`
                  gap-2 transition-all
                  ${court.active
                    ? "border-zona5-navy/20 text-zona5-navy hover:bg-zona5-navy hover:text-white"
                    : "bg-zona5-green text-white hover:bg-zona5-greenDark"
                  }
                `}
              >
                <Power className="h-3.5 w-3.5" />
                {toggling
                  ? "…"
                  : court.active
                  ? "Desactivar"
                  : "Activar"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Active glow line */}
      {court.active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-zona5-coral via-zona5-gold to-zona5-green opacity-70" />
      )}
    </div>
  );
}
