import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { canManageCourts } from "@/lib/auth/permissions";
import { Plus, Power } from "lucide-react";
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
    const { error: updateErr } = await supabase
      .from("courts")
      .update({ active: !court.active })
      .eq("id", court.id);

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canchas</h1>
          <p className="text-sm text-muted-foreground">
            {courts.length} cancha{courts.length !== 1 ? "s" : ""} configurada{courts.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <Button onClick={addCourt} disabled={submitting} className="gap-2">
            <Plus className="h-4 w-4" />
            {submitting ? "Creando…" : "Agregar cancha"}
          </Button>
        )}
      </div>

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {courts.map((court) => (
            <Card
              key={court.id}
              className={court.active ? "" : "opacity-50"}
            >
              <CardContent className="flex flex-col items-center gap-3 p-5">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold ${
                    court.active
                      ? "bg-zona5-coral/10 text-zona5-coral"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {court.number}
                </div>
                <p className="text-sm font-semibold text-zona5-navy">
                  {court.name}
                </p>
                <Badge variant={court.active ? "success" : "secondary"}>
                  {court.active ? "Activa" : "Inactiva"}
                </Badge>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(court)}
                    className="mt-1 gap-1.5 text-xs"
                  >
                    <Power className="h-3.5 w-3.5" />
                    {court.active ? "Desactivar" : "Activar"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
