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
import { canManageCatalog, canEditPrices } from "@/lib/auth/permissions";
import { pesosToCents, centsToPesos, isValidPrice } from "@/lib/validation";
import { Plus, BookOpen, Pencil, Power } from "lucide-react";
import type { Database } from "@/types/database";

type CatalogItem = Database["public"]["Tables"]["catalog_items"]["Row"];
type CatalogCategory = Database["public"]["Tables"]["catalog_categories"]["Row"];

export function CatalogPage() {
  const { membership } = useAuth();
  const { toast } = useToast();
  const role = membership?.role;
  const canManage = canManageCatalog(role);
  const userCanEditPrices = canEditPrices(role);

  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [categories, setCategories] = React.useState<CatalogCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CatalogItem | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    type: "servicio" as "servicio" | "producto",
    price: "0",
    categoryId: "",
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const [itemsRes, catRes] = await Promise.all([
      supabase
        .from("catalog_items")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("catalog_categories")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    if (itemsRes.error) {
      setError(itemsRes.error.message);
    } else if (catRes.error) {
      setError(catRes.error.message);
    } else {
      setItems((itemsRes.data ?? []) as CatalogItem[]);
      setCategories((catRes.data ?? []) as CatalogCategory[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const categoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name ?? "Sin categoría";

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      type: "servicio",
      price: "0",
      categoryId: categories[0]?.id ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type,
      price: centsToPesos(item.price_cents),
      categoryId: item.category_id,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    if (!name) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!form.categoryId) {
      setFormError("Selecciona una categoría.");
      return;
    }
    if (!isValidPrice(form.price)) {
      setFormError("El precio debe ser un valor positivo válido (máx. $999,999.99).");
      return;
    }

    const priceCents = pesosToCents(form.price);

    if (editing && !userCanEditPrices) {
      setSubmitting(true);
      const { error: updateErr } = await supabase
        .from("catalog_items")
        .update({
          name,
          type: form.type,
          category_id: form.categoryId,
        })
        .eq("id", editing.id);

      setSubmitting(false);

      if (updateErr) {
        setFormError(updateErr.message);
        return;
      }
      toast({ title: "Artículo actualizado", variant: "success" });
      setDialogOpen(false);
      loadData();
      return;
    }

    setSubmitting(true);

    if (editing) {
      const { error: updateErr } = await supabase
        .from("catalog_items")
        .update({
          name,
          type: form.type,
          price_cents: priceCents,
          category_id: form.categoryId,
        })
        .eq("id", editing.id);

      setSubmitting(false);

      if (updateErr) {
        setFormError(updateErr.message);
        return;
      }
      toast({ title: "Artículo actualizado", variant: "success" });
    } else {
      const { error: insertErr } = await supabase
        .from("catalog_items")
        .insert({
          category_id: form.categoryId,
          name,
          type: form.type,
          price_cents: priceCents,
        });

      setSubmitting(false);

      if (insertErr) {
        setFormError(insertErr.message);
        return;
      }
      toast({ title: "Artículo creado", variant: "success" });
    }

    setDialogOpen(false);
    loadData();
  }

  async function toggleAvailable(item: CatalogItem) {
    const { error: updateErr } = await supabase
      .from("catalog_items")
      .update({ available: !item.available })
      .eq("id", item.id);

    if (updateErr) {
      toast({
        title: "Error",
        description: updateErr.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: item.available ? "Artículo desactivado" : "Artículo activado",
      variant: "success",
    });
    loadData();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            Productos y servicios del club
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo artículo
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin artículos aún"
          description="Agrega el primer producto o servicio al catálogo."
          icon={<BookOpen className="h-6 w-6" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  {canManage && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {categoryName(item.category_id)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {item.type === "servicio" ? "Servicio" : "Producto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {centsToPesos(item.price_cents)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.available ? "success" : "secondary"}>
                        {item.available ? "Disponible" : "No disponible"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAvailable(item)}
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
              {editing ? "Editar artículo" : "Nuevo artículo"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del artículo."
                : "Captura los datos del nuevo producto o servicio."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Nombre *</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-category">Categoría *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger id="item-category">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v as "servicio" | "producto" })
                }
              >
                <SelectTrigger id="item-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicio">Servicio</SelectItem>
                  <SelectItem value="producto">Producto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">
                Precio (MXN){" "}
                {editing && !userCanEditPrices && (
                  <span className="text-xs text-muted-foreground">
                    — no tienes permiso para cambiar el precio
                  </span>
                )}
              </Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                disabled={submitting || (!!editing && !userCanEditPrices)}
                required
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
