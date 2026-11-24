import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { Save } from "lucide-react";
import type { Database } from "@/types/database";

type ClubSettings = Database["public"]["Tables"]["club_settings"]["Row"];

export function SettingsPage() {
  const { toast } = useToast();

  const [settings, setSettings] = React.useState<ClubSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    opening_hours: "",
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: qErr } = await supabase
      .from("club_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (qErr) {
      setError(qErr.message);
    } else {
      const s = data as ClubSettings | null;
      setSettings(s);
      setForm({
        name: s?.name ?? "",
        contact_phone: s?.contact_phone ?? "",
        contact_email: s?.contact_email ?? "",
        address: s?.address ?? "",
        opening_hours: s?.opening_hours ?? "",
      });
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      address: form.address.trim() || null,
      opening_hours: form.opening_hours.trim() || null,
    };

    if (settings) {
      const { error: setErr } = await supabase
        .from("club_settings")
        .update(payload)
        .eq("id", settings.id);

      if (setErr) {
        toast({
          title: "Error al guardar",
          description: setErr.message,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    } else {
      const { error: insertErr } = await supabase
        .from("club_settings")
        .insert(payload);

      if (insertErr) {
        toast({
          title: "Error al guardar",
          description: insertErr.message,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    }

    toast({ title: "Configuración guardada", variant: "success" });
    setSubmitting(false);
    loadData();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Datos generales del club
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Información del club</CardTitle>
            <CardDescription>
              Nombre y datos de contacto del club
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club-name">Nombre del club *</Label>
              <Input
                id="club-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-phone">Teléfono de contacto</Label>
              <Input
                id="club-phone"
                type="tel"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
                disabled={submitting}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-email">Correo de contacto</Label>
              <Input
                id="club-email"
                type="email"
                value={form.contact_email}
                onChange={(e) =>
                  setForm({ ...form, contact_email: e.target.value })
                }
                disabled={submitting}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-address">Dirección</Label>
              <Input
                id="club-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                disabled={submitting}
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-hours">Horarios</Label>
              <Input
                id="club-hours"
                placeholder="Ej. Lun-Vie 7:00-23:00, Sáb-Dom 8:00-22:00"
                value={form.opening_hours}
                onChange={(e) =>
                  setForm({ ...form, opening_hours: e.target.value })
                }
                disabled={submitting}
                maxLength={200}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parámetros del sistema</CardTitle>
            <CardDescription>
              Estos valores están fijos para el club
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Zona horaria</span>
              <span className="font-medium">America/Cancun</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Moneda</span>
              <span className="font-medium">MXN ($)</span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={submitting} className="gap-2">
          <Save className="h-4 w-4" />
          {submitting ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
