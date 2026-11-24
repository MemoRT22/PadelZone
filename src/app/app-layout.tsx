import * as React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { roleLabel, canManageCourts, canManageCatalog, canManageSettings, canManagePlayers } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  RectangleHorizontal,
  BookOpen,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  Lock,
  CalendarDays,
  DollarSign,
  Trophy,
  Coins,
  Receipt,
  ChefHat,
  MessageCircle,
  CreditCard,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppLayout() {
  const { club, membership, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const role = membership?.role;

  const sections: NavSection[] = [
    {
      title: "Operación",
      items: [
        { to: "/", label: "Panel", icon: <LayoutDashboard className="h-5 w-5" />, visible: true },
        { to: "/jugadores", label: "Jugadores", icon: <Users className="h-5 w-5" />, visible: canManagePlayers(role) },
        { to: "/canchas", label: "Canchas", icon: <RectangleHorizontal className="h-5 w-5" />, visible: canManageCourts(role) },
        { to: "/catalogo", label: "Catálogo", icon: <BookOpen className="h-5 w-5" />, visible: canManageCatalog(role) },
        { to: "/configuracion", label: "Configuración", icon: <Settings className="h-5 w-5" />, visible: canManageSettings(role) },
        { to: "/personal", label: "Personal", icon: <UserCog className="h-5 w-5" />, visible: role === "propietario" },
      ],
    },
    {
      title: "Próximamente",
      items: [
        { to: "#agenda", label: "Agenda y reservas", icon: <CalendarDays className="h-5 w-5" />, visible: true },
        { to: "#caja", label: "Caja y cortes", icon: <DollarSign className="h-5 w-5" />, visible: true },
        { to: "#retas", label: "Retas", icon: <Trophy className="h-5 w-5" />, visible: true },
        { to: "#patodolares", label: "Patodólares", icon: <Coins className="h-5 w-5" />, visible: true },
        { to: "#comisiones", label: "Comisiones", icon: <Receipt className="h-5 w-5" />, visible: true },
        { to: "#comandas", label: "Comandas", icon: <ChefHat className="h-5 w-5" />, visible: true },
        { to: "#whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-5 w-5" />, visible: true },
        { to: "#clip", label: "Clip", icon: <CreditCard className="h-5 w-5" />, visible: true },
      ],
    },
  ];

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  function handleNavClick(e: React.MouseEvent, to: string) {
    if (to.startsWith("#")) {
      e.preventDefault();
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            CP
          </div>
          <span className="truncate text-sm font-semibold">
            {club?.name ?? "Club de Pádel"}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items
                  .filter((item) => item.visible)
                  .map((item) => {
                    const isPlaceholder = item.to.startsWith("#");
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={(e) => handleNavClick(e, item.to)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isPlaceholder
                            ? "cursor-not-allowed text-muted-foreground/60"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
                        )}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {isPlaceholder && (
                          <Lock className="h-3 w-3 opacity-50" />
                        )}
                      </NavLink>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium">
              {membership?.display_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {membership?.display_name ?? "Usuario"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {role ? roleLabel(role) : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Top bar - mobile */}
        <header className="flex h-16 items-center gap-3 border-b bg-background px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="truncate text-sm font-semibold">
            {club?.name ?? "Club de Pádel"}
          </span>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


