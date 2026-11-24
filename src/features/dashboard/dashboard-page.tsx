import { useAuth } from "@/features/auth/auth-context";
import { roleLabel } from "@/lib/auth/permissions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  RectangleHorizontal,
  BookOpen,
  Settings,
  CalendarDays,
  DollarSign,
  Trophy,
  Coins,
} from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { membership, club } = useAuth();
  const role = membership?.role;

  const quickLinks = [
    { to: "/jugadores", label: "Jugadores", icon: <Users className="h-5 w-5" />, visible: ["propietario", "gerente", "cajero"].includes(role ?? "") },
    { to: "/canchas", label: "Canchas", icon: <RectangleHorizontal className="h-5 w-5" />, visible: ["propietario", "gerente"].includes(role ?? "") },
    { to: "/catalogo", label: "Catálogo", icon: <BookOpen className="h-5 w-5" />, visible: ["propietario", "gerente"].includes(role ?? "") },
    { to: "/configuracion", label: "Configuración", icon: <Settings className="h-5 w-5" />, visible: role === "propietario" },
    { to: "/personal", label: "Personal", icon: <Users className="h-5 w-5" />, visible: role === "propietario" },
  ].filter((l) => l.visible);

  const upcoming = [
    { label: "Agenda y reservas", icon: <CalendarDays className="h-5 w-5" /> },
    { label: "Caja y cortes", icon: <DollarSign className="h-5 w-5" /> },
    { label: "Retas", icon: <Trophy className="h-5 w-5" /> },
    { label: "Patodólares", icon: <Coins className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {club?.name ?? "Club de Pádel"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido, {membership?.display_name} — {role ? roleLabel(role) : ""}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Accesos rápidos
        </h2>
        {quickLinks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No tienes permisos de gestión asignados todavía.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Card className="cursor-pointer transition-colors hover:border-primary/30 hover:bg-accent">
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {link.icon}
                    </div>
                    <span className="text-sm font-medium">{link.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Próximamente
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {upcoming.map((item) => (
            <Card key={item.label} className="opacity-50">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {item.icon}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
