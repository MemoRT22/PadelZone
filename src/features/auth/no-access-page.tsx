import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export function NoAccessPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zona5-navy">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-zona5-coral/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zona5-coral/15">
          <ShieldX className="h-8 w-8 text-zona5-coral" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">Sin acceso al club</h1>
        <p className="mb-6 text-sm leading-relaxed text-zona5-cream/50">
          Tu cuenta no está vinculada a ningún club o tu membresía está inactiva.
          Contacta al propietario para que te dé de alta.
        </p>
        {user && (
          <p className="mb-6 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-zona5-cream/40">
            Sesión: {user.email}
          </p>
        )}
        <Button
          onClick={() => signOut()}
          className="h-11 w-full rounded-xl bg-zona5-coral text-white shadow-lg shadow-zona5-coral/25 hover:bg-zona5-coralDark"
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
