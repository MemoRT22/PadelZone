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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { roleLabel } from "@/lib/auth/permissions";
import type { ClubRole } from "@/types/database";
import { UserCog, Plus, Power } from "lucide-react";
import type { Database } from "@/types/database";

type Membership = Database["public"]["Tables"]["club_memberships"]["Row"];

const ALL_ROLES: ClubRole[] = [
  "propietario",
  "gerente",
  "cajero",
  "cocina",
  "entrenador",
  "organizador",
];

export function StaffPage() {
  const { membership } = useAuth();
  const { toast } = useToast();
  const clubId = membership?.club_id;

  const [members, setMembers] = React.useState<Membership[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "",
    password: "",
    displayName: "",
    role: "cajero" as ClubRole,
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const loadMembers = React.useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from("club_memberships")
      .select("*")
      .eq("club_id", clubId)
      .order("display_name", { ascending: true });

    if (qErr) {
      setError(qErr.message);
    } else {
      setMembers((data ?? []) as Membership[]);
    }
    setLoading(false);
  }, [clubId]);

  React.useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId) return;
    setFormError(null);

    const email = form.email.trim();
    const password = form.password;
    const displayName = form.displayName.trim();

    if (!email || !password || !displayName) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }
    if (password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSubmitting(true);

    // Create auth user via admin API through edge function would be ideal,
    // but for F0 we use signUp — note: this requires "Allow new users to sign up" enabled
    // In production, propietario creates users through Supabase dashboard or an edge function
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: form.role,
          display_name: displayName,
          club_id: clubId,
        },
      },
    });

    if (authErr) {
      setSubmitting(false);
      setFormError(authErr.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setSubmitting(false);
      setFormError("No se pudo crear el usuario.");
      return;
    }

    // Insert membership
    const { error: memberErr } = await supabase
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: userId,
        role: form.role,
        display_name: displayName,
        active: true,
      });

    setSubmitting(false);

    if (memberErr) {
      setFormError(
        `Usuario creado pero error al asignar membresía: ${memberErr.message}. Contacta al administrador.`
      );
      return;
    }

    toast({
      title: "Miembro del personal creado",
      description: `${displayName} — ${roleLabel(form.role)}`,
      variant: "success",
    });

    setDialogOpen(false);
    setForm({ email: "", password: "", displayName: "", role: "cajero" });
    loadMembers();
  }

  async function toggleActive(member: Membership) {
    if (member.user_id === membership?.user_id) {
      toast({
        title: "No puedes desactivarte a ti mismo",
        variant: "destructive",
      });
      return;
    }

    const { error: updateErr } = await supabase
      .from("club_memberships")
      .update({ active: !member.active })
      .eq("id", member.id);

    if (updateErr) {
      toast({
        title: "Error",
        description: updateErr.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: member.active ? "Miembro desactivado" : "Miembro activado",
      variant: "success",
    });
    loadMembers();
  }

  async function changeRole(member: Membership, newRole: ClubRole) {
    if (member.user_id === membership?.user_id && newRole !== "propietario") {
      toast({
        title: "No puedes cambiar tu propio rol",
        variant: "destructive",
      });
      return;
    }

    const { error: updateErr } = await supabase
      .from("club_memberships")
      .update({ role: newRole })
      .eq("id", member.id);

    if (updateErr) {
      toast({
        title: "Error",
        description: updateErr.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Rol actualizado", variant: "success" });
    loadMembers();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personal</h1>
          <p className="text-sm text-muted-foreground">
            Administra los miembros del personal y sus roles
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ email: "", password: "", displayName: "", role: "cajero" });
            setFormError(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo miembro
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadMembers} />
      ) : members.length === 0 ? (
        <EmptyState
          title="Sin miembros del personal"
          description="Agrega el primer miembro del personal."
          icon={<UserCog className="h-6 w-6" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.display_name}
                      {member.user_id === membership?.user_id && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (tú)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.user_id === membership?.user_id ? (
                        <Badge variant="default">
                          {roleLabel(member.role)}
                        </Badge>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(v) =>
                            changeRole(member, v as ClubRole)
                          }
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {roleLabel(r)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.active ? "success" : "secondary"}>
                        {member.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.user_id !== membership?.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(member)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
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
            <DialogTitle>Nuevo miembro del personal</DialogTitle>
            <DialogDescription>
              Crea una cuenta para un nuevo miembro del personal y asígnale un rol.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nombre *</Label>
              <Input
                id="staff-name"
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                disabled={submitting}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Correo *</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">Contraseña *</Label>
              <Input
                id="staff-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={submitting}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres. El miembro podrá cambiarla después.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Rol *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as ClubRole })}
              >
                <SelectTrigger id="staff-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {submitting ? "Creando…" : "Crear miembro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
