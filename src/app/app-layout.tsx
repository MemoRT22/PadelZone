import * as React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { roleLabel, canManageCourts, canManageCatalog, canManageSettings, canManagePlayers } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  RectangleHorizontal,
  BookOpen,
  Settings,
  UserCog,
  LogOut,
  Lock,
  ChevronLeft,
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
  const { membership, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = membership?.role;
  const [railExpanded, setRailExpanded] = React.useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const previousPath = React.useRef(location.pathname);

  React.useEffect(() => {
    if (previousPath.current !== location.pathname) {
      setMobileSheetOpen(false);
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  const sections: NavSection[] = [
    {
      title: "Operacion",
      items: [
        { to: "/", label: "Panel", icon: <LayoutDashboard className="h-[18px] w-[18px]" />, visible: true },
        { to: "/jugadores", label: "Jugadores", icon: <Users className="h-[18px] w-[18px]" />, visible: canManagePlayers(role) },
        { to: "/canchas", label: "Canchas", icon: <RectangleHorizontal className="h-[18px] w-[18px]" />, visible: canManageCourts(role) },
        { to: "/catalogo", label: "Catalogo", icon: <BookOpen className="h-[18px] w-[18px]" />, visible: canManageCatalog(role) },
        { to: "/configuracion", label: "Configuracion", icon: <Settings className="h-[18px] w-[18px]" />, visible: canManageSettings(role) },
        { to: "/personal", label: "Personal", icon: <UserCog className="h-[18px] w-[18px]" />, visible: role === "propietario" },
      ],
    },
  ];

  const visibleItems = sections.flatMap((s) => s.items).filter((i) => i.visible);

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-zona5-warm">
      {/* ===== Desktop rail ===== */}
      <aside
        onMouseEnter={() => setRailExpanded(true)}
        onMouseLeave={() => setRailExpanded(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-zona5-navy transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
          railExpanded ? "w-52" : "w-[60px]"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-[18px]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zona5-coral text-sm font-black text-white">
            Z5
          </div>
          <div
            className={cn(
              "min-w-0 transition-opacity duration-200",
              railExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <p className="truncate text-sm font-bold tracking-tight text-white">Zona 5</p>
            <p className="truncate text-[10px] text-zona5-cream/40">Padel Club</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 px-[18px] py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-zona5-cream/45 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-zona5-coral" />
                  )}
                  {item.icon}
                  <span
                    className={cn(
                      "whitespace-nowrap transition-opacity duration-200",
                      railExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="shrink-0 border-t border-white/[0.06] px-[18px] py-3">
          <div
            className={cn(
              "flex items-center gap-2.5 overflow-hidden transition-opacity duration-200",
              railExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zona5-coral/15 text-xs font-bold text-zona5-coralSoft">
              {membership?.display_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {membership?.display_name ?? "Usuario"}
              </p>
              <p className="truncate text-[10px] text-zona5-cream/35">
                {role ? roleLabel(role) : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-lg px-0 py-2 text-xs font-medium text-zona5-cream/40 transition-colors hover:text-zona5-coralSoft",
              !railExpanded && "justify-center"
            )}
            aria-label="Cerrar sesion"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className={cn("whitespace-nowrap transition-opacity duration-200", railExpanded ? "opacity-100" : "opacity-0")}>
              Cerrar sesion
            </span>
          </button>
        </div>
      </aside>

      {/* ===== Mobile bottom bar ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-white/10 bg-zona5-navy lg:hidden">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                isActive ? "text-zona5-coral" : "text-zona5-cream/40"
              )}
            >
              {item.icon}
              <span className="text-[9px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        {visibleItems.length > 5 && (
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-zona5-cream/40"
            aria-label="Mas opciones"
          >
            <Lock className="h-[18px] w-[18px]" />
            <span className="text-[9px] font-medium">Mas</span>
          </button>
        )}
      </nav>

      {/* Mobile expanded sheet */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-zona5-navy/70 backdrop-blur-sm"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-zona5-navy p-5 pb-8 panel-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Mas opciones</p>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="rounded-lg p-1.5 text-zona5-cream/50 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <ChevronLeft className="h-5 w-5 rotate-90" />
              </button>
            </div>
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const isActive =
                  item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                      isActive ? "bg-zona5-coral text-white" : "text-zona5-cream/60 hover:bg-white/5"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-zona5-cream/40 hover:bg-white/5"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Main content ===== */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-[60px]">
        <main className="flex-1 overflow-x-hidden px-4 pb-20 pt-5 lg:px-10 lg:pb-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
