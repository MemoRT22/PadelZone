import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const from = (location.state as { from?: string })?.from ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError("Captura correo y contraseña.");
      return;
    }
    setSubmitting(true);
    const { error: signInErr } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInErr) {
      setLocalError(
        "Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo."
      );
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zona5-navy">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-zona5-coral/15 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-zona5-green/12 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-zona5-navyMid/40 blur-[80px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <img
              src="/logo-zona5.svg"
              alt="Zona 5 Padel Club"
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Zona 5 Padel Club</h1>
          <p className="mt-1 text-sm text-zona5-cream/40">Cancún, Quintana Roo</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-zona5-cream/60">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
                className="h-11 border-white/10 bg-zona5-navy/50 text-white placeholder:text-zona5-cream/25 focus:border-zona5-coral focus:ring-zona5-coral/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-zona5-cream/60">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
                className="h-11 border-white/10 bg-zona5-navy/50 text-white placeholder:text-zona5-cream/25 focus:border-zona5-coral focus:ring-zona5-coral/20"
              />
            </div>
            {localError && (
              <div className="rounded-lg border border-zona5-coral/30 bg-zona5-coral/10 px-3 py-2.5">
                <p className="text-sm font-medium text-zona5-coralSoft" role="alert">
                  {localError}
                </p>
              </div>
            )}
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-zona5-coral text-white shadow-lg shadow-zona5-coral/25 transition-all hover:bg-zona5-coralDark hover:shadow-zona5-coral/30"
              disabled={submitting || loading}
            >
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zona5-cream/30">
          Donde el pádel se convierte en comunidad
        </p>
      </div>
    </div>
  );
}
