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
      {/* Layered decorative background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Large coral glow — top left */}
        <div className="absolute -left-40 -top-20 h-[28rem] w-[28rem] rounded-full bg-zona5-coral/12 blur-[140px]" />
        {/* Green glow — bottom right */}
        <div className="absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-zona5-green/10 blur-[140px]" />
        {/* Gold accent — center right */}
        <div className="absolute right-1/4 top-1/4 h-48 w-48 rounded-full bg-zona5-gold/8 blur-[100px]" />
        {/* Navy mid — center depth */}
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zona5-navyMid/50 blur-[90px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,220,180,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,220,180,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm">
            <img
              src="/logo-zona5.svg"
              alt="Zona 5 Padel Club"
              className="h-14 w-14"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Zona 5 Padel Club
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-zona5-cream/20" />
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zona5-cream/35">
              Cancún, Quintana Roo
            </p>
            <span className="h-px w-8 bg-zona5-cream/20" />
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-zona5-cream/55"
              >
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
                className="h-11 border-white/10 bg-zona5-navy/40 text-white placeholder:text-zona5-cream/20 focus:border-zona5-coral focus:ring-zona5-coral/20"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-zona5-cream/55"
              >
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
                className="h-11 border-white/10 bg-zona5-navy/40 text-white placeholder:text-zona5-cream/20 focus:border-zona5-coral focus:ring-zona5-coral/20"
              />
            </div>

            {localError && (
              <div className="rounded-lg border border-zona5-coral/25 bg-zona5-coral/8 px-3.5 py-3">
                <p
                  className="text-sm font-medium text-zona5-coralSoft"
                  role="alert"
                >
                  {localError}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-zona5-coral text-white shadow-lg shadow-zona5-coral/20 transition-all hover:bg-zona5-coralDark hover:shadow-zona5-coral/30"
              disabled={submitting || loading}
            >
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>
        </div>

        {/* Tagline */}
        <p className="mt-7 text-center text-xs text-zona5-cream/25">
          Donde el pádel se convierte en comunidad
        </p>
      </div>
    </div>
  );
}
