import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CircleDot } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-court-dark via-court-green to-court-dark px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CircleDot className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Club de Pádel</CardTitle>
          <CardDescription>Sistema de gestión integral</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            {localError && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {localError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
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
