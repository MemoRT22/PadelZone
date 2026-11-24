import { useAuth } from "@/features/auth/auth-context";
import { roleLabel } from "@/lib/auth/permissions";
import {
  Users,
  RectangleHorizontal,
  BookOpen,
  Settings,
  CalendarDays,
  DollarSign,
  Trophy,
  Coins,
  UserCog,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const { membership, club } = useAuth();
  const role = membership?.role;

  const quickLinks = [
    { to: "/jugadores", label: "Jugadores", icon: <Users className="h-5 w-5" />, desc: "Registro y búsqueda", visible: ["propietario", "gerente", "cajero"].includes(role ?? "") },
    { to: "/canchas", label: "Canchas", icon: <RectangleHorizontal className="h-5 w-5" />, desc: "5 canchas certificadas", visible: ["propietario", "gerente"].includes(role ?? "") },
    { to: "/catalogo", label: "Catálogo", icon: <BookOpen className="h-5 w-5" />, desc: "Productos y servicios", visible: ["propietario", "gerente"].includes(role ?? "") },
    { to: "/configuracion", label: "Configuración", icon: <Settings className="h-5 w-5" />, desc: "Datos del club", visible: role === "propietario" },
    { to: "/personal", label: "Personal", icon: <UserCog className="h-5 w-5" />, desc: "Roles y accesos", visible: role === "propietario" },
  ].filter((l) => l.visible);

  const upcoming = [
    { label: "Agenda y reservas", icon: <CalendarDays className="h-5 w-5" /> },
    { label: "Caja y cortes", icon: <DollarSign className="h-5 w-5" /> },
    { label: "Retas", icon: <Trophy className="h-5 w-5" /> },
    { label: "Patodólares", icon: <Coins className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zona5-navy">
          {club?.name ?? "Zona 5 Padel Club"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Bienvenido, {membership?.display_name} — {role ? roleLabel(role) : ""}
        </p>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Accesos rápidos
        </h2>
        {quickLinks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
            No tienes permisos de gestión asignados todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:border-zona5-coral/40 hover:shadow-lift"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zona5-coral/10 text-zona5-coral transition-colors group-hover:bg-zona5-coral group-hover:text-white">
                    {link.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zona5-navy">{link.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Próximamente
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {upcoming.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-5 text-center"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zona5-navy/5 text-zona5-navy/30">
                {item.icon}
              </div>
              <span className="text-xs font-medium text-muted-foreground/60">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
