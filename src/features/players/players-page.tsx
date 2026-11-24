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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { isValidPhoneMX, normalizePhoneMX, formatPhoneMX } from "@/lib/validation";
import { canManagePlayers } from "@/lib/auth/permissions";
import { Plus, Search, Users, Pencil, Power } from "lucide-react";
import type { Database } from "@/types/database";

type Player = Database["public"]["Tables"]["players"]["Row"];

export function PlayersPage() {
  const { membership } = useAuth();
  const { toast } = useToast();
  const clubId = membership?.club_id;
  const role = membership?.role;
  const canManage = canManagePlayers(role);

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Player | null>(null);
  const [form, setForm] = React.useState({ name: "", phone: "", notes: "" });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const loadPlayers = React.useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("players")
      .select("*")
      .eq("club_id", clubId)
      .order("name", { ascending: true });

    if (qErr) {
      setError(qErr.message);
    } else {
      setPlayers((data ?? []) as Player[]);
    }
    setLoading(false);
  }, [clubId]);

  React.useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return players;
    const q = search.toLowerCase().trim();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone ?? "").includes(q) ||
        formatPhoneMX(p.phone).includes(q)
    );
  }, [players, search]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", phone: "", notes: "" });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(player: Player) {
    setEditing(player);
    setForm({
      name: player.name,
      phone: player.phone ?? "",
      notes: player.notes ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId) return;
    setFormError(null);

    const name = form.name.trim();
    if (!name) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (form.phone && !isValidPhoneMX(form.phone)) {
      setFormError("El teléfono debe tener 10 dígitos (formato México).");
      return;
    }

    const phone = form.phone.trim() || null;
    const normalizedPhone = phone ? normalizePhoneMX(phone) : null;

    // Check duplicates
    if (normalizedPhone) {
      const { data: existing } = await supabase
        .from("players")
        .select("id, name")
        .eq("club_id", clubId)
        .eq("normalized_phone", normalizedPhone)
        .neq("id", editing?.id ?? "")
        .maybeSingle();

      if (existing) {
        setFormError(
          `Ya existe un jugador con ese teléfono: ${(existing as Player).name}`
        );
        return;
      }
    }

    setSubmitting(true);

    if (editing) {
      const { error: updateErr } = await supabase
        .from("players")
        .update({
          name,
          phone,
          normalized_phone: normalizedPhone,
          notes: form.notes.trim() || null,
        })
        .eq("id", editing.id);

      setSubmitting(false);

      if (updateErr) {
        setFormError(updateErr.message);
        return;
      }
      toast({ title: "Jugador actualizado", variant: "success" });
    } else {
      const { error: insertErr } = await supabase
        .from("players")
        .insert({
          club_id: clubId,
          name,
          phone,
          normalized_phone: normalizedPhone,
          notes: form.notes.trim() || null,
        });

      setSubmitting(false);

      if (insertErr) {
        setFormError(insertErr.message);
        return;
      }
      toast({ title: "Jugador creado", variant: "success" });
    }

    setDialogOpen(false);
    loadPlayers();
  }

  async function toggleActive(player: Player) {
    const { error: updateErr } = await supabase
      .from("players")
      .update({ active: !player.active })
      .eq("id", player.id);

    if (updateErr) {
      toast({
        title: "Error",
        description: updateErr.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: player.active ? "Jugador desactivado" : "Jugador activado",
      variant: "success",
    });
    loadPlayers();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-sm text-muted-foreground">
            Administra los jugadores del club
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo jugador
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPlayers} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? "Sin resultados" : "Sin jugadores aún"}
          description={
            search
              ? "Prueba con otro término de búsqueda."
              : "Agrega el primer jugador del club."
          }
          icon={<Users className="h-6 w-6" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden md:table-cell">Notas</TableHead>
                  <TableHead>Estado</TableHead>
                  {canManage && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatPhoneMX(player.phone) || "—"}
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                      {player.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={player.active ? "success" : "secondary"}>
                        {player.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(player)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActive(player)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar jugador" : "Nuevo jugador"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del jugador."
                : "Captura los datos del nuevo jugador."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10 dígitos"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={submitting}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Formato México, 10 dígitos. Opcional.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={submitting}
                maxLength={500}
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
