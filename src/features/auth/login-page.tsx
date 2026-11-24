import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center bg-zona5-navy px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-zona5-coral/10 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-zona5-green/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-zona5-navyLight/30 bg-zona5-navyLight text-zona5-cream shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center">
            <img
              src="/logo-zona5.svg"
              alt="Zona 5 Padel Club"
              className="h-16 w-16"
            />
          </div>
          <div>
            <CardTitle className="text-2xl text-zona5-cream">Zona 5 Padel Club</CardTitle>
            <CardDescription className="text-zona5-cream/60">
              Sistema de gestión integral
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zona5-cream/80">
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
                className="border-zona5-navy/50 bg-zona5-navy text-zona5-cream placeholder:text-zona5-cream/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zona5-cream/80">
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
                className="border-zona5-navy/50 bg-zona5-navy text-zona5-cream placeholder:text-zona5-cream/30"
              />
            </div>
            {localError && (
              <p className="text-sm font-medium text-zona5-coralLight" role="alert">
                {localError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-zona5-coral text-zona5-cream hover:bg-zona5-coralDark"
              disabled={submitting || loading}
            >
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
