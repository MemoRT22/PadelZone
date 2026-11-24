import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { canManageCourts } from "@/lib/auth/permissions";
import { Plus, RectangleHorizontal, Pencil, Power, ArrowUp, ArrowDown } from "lucide-react";
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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Court | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    number: "",
    surface: "",
    description: "",
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const loadCourts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("courts")
      .select("*")
      .order("sort_order", { ascending: true })
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

  function openCreate() {
    setEditing(null);
    const nextNumber = courts.length + 1;
    setForm({
      name: `Cancha ${nextNumber}`,
      number: String(nextNumber),
      surface: "",
      description: "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(court: Court) {
    setEditing(court);
    setForm({
      name: court.name,
      number: String(court.number),
      surface: court.surface ?? "",
      description: court.description ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    const num = parseInt(form.number, 10);

    if (!name) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (isNaN(num) || num < 1) {
      setFormError("El número de cancha debe ser un entero positivo.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name,
      number: num,
      surface: form.surface.trim() || null,
      description: form.description.trim() || null,
    };

    if (editing) {
      const { error: updateErr } = await supabase
        .from("courts")
        .update(payload)
        .eq("id", editing.id);

      setSubmitting(false);

      if (updateErr) {
        setFormError(updateErr.message);
        return;
      }
      toast({ title: "Cancha actualizada", variant: "success" });
    } else {
      const sortOrder = courts.length;
      const { error: insertErr } = await supabase
        .from("courts")
        .insert({
          ...payload,
          sort_order: sortOrder,
        });

      setSubmitting(false);

      if (insertErr) {
        setFormError(insertErr.message);
        return;
      }
      toast({ title: "Cancha creada", variant: "success" });
    }

    setDialogOpen(false);
    loadCourts();
  }

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

  async function moveCourt(court: Court, direction: "up" | "down") {
    const sorted = [...courts].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === court.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swap = sorted[swapIdx]!;

    const { error: e1 } = await supabase
      .from("courts")
      .update({ sort_order: swap.sort_order })
      .eq("id", court.id);

    const { error: e2 } = await supabase
      .from("courts")
      .update({ sort_order: court.sort_order })
      .eq("id", swap.id);

    if (e1 || e2) {
      toast({
        title: "Error al reordenar",
        variant: "destructive",
      });
      return;
    }
    loadCourts();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canchas</h1>
          <p className="text-sm text-muted-foreground">
            Administra las canchas del club
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva cancha
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCourts} />
      ) : courts.length === 0 ? (
        <EmptyState
          title="Sin canchas aún"
          description="Agrega la primera cancha del club."
          icon={<RectangleHorizontal className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court, idx) => (
            <Card
              key={court.id}
              className={court.active ? "" : "opacity-60"}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        court.active
                          ? "bg-zona5-green/12 text-zona5-greenDark"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {court.number}
                    </div>
                    <div>
                      <p className="font-medium">{court.name}</p>
                      {court.surface && (
                        <p className="text-xs text-muted-foreground">
                          {court.surface}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={court.active ? "success" : "secondary"}>
                    {court.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                {court.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {court.description}
                  </p>
                )}
                {canManage && (
                  <div className="mt-3 flex gap-1 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCourt(court, "up")}
                      disabled={idx === 0}
                      className="gap-1"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCourt(court, "down")}
                      disabled={idx === courts.length - 1}
                      className="gap-1"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(court)}
                      className="gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(court)}
                      className="gap-1"
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar cancha" : "Nueva cancha"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos de la cancha."
                : "Captura los datos de la nueva cancha."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="court-name">Nombre *</Label>
              <Input
                id="court-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="court-number">Número *</Label>
              <Input
                id="court-number"
                type="number"
                min={1}
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="court-surface">Superficie</Label>
              <Input
                id="court-surface"
                placeholder="Cristal, muro, césped, etc."
                value={form.surface}
                onChange={(e) => setForm({ ...form, surface: e.target.value })}
                disabled={submitting}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="court-desc">Descripción</Label>
              <Input
                id="court-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                disabled={submitting}
                maxLength={300}
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
                onClick={() => setDialogOpen(false)}
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
    </div>
  );
}
