import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export function NoAccessPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zona5-navy">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-20 h-[28rem] w-[28rem] rounded-full bg-zona5-coral/12 blur-[140px]" />
        <div className="absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-zona5-green/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,220,180,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,220,180,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm">
          <ShieldX className="h-10 w-10 text-zona5-coral" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">Sin acceso al club</h1>
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-zona5-cream/20" />
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zona5-cream/35">
            Acceso restringido
          </p>
          <span className="h-px w-8 bg-zona5-cream/20" />
        </div>
        <p className="mb-6 text-sm leading-relaxed text-zona5-cream/45">
          Tu cuenta no está vinculada al club o tu membresía está inactiva.
          Contacta al propietario para que te dé de alta.
        </p>
        {user && (
          <p className="mb-6 rounded-lg border border-white/5 bg-white/[0.04] px-3 py-2 text-xs text-zona5-cream/35">
            Sesión: {user.email}
          </p>
        )}
        <Button
          onClick={() => signOut()}
          className="h-11 w-full rounded-xl bg-zona5-coral text-white shadow-lg shadow-zona5-coral/20 hover:bg-zona5-coralDark"
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
