import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

export function NoAccessPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zona5-navy px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-zona5-coral/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-zona5-navyLight/30 bg-zona5-navyLight text-zona5-cream shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zona5-coral/20 text-zona5-coral">
            <ShieldX className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl text-zona5-cream">Sin acceso al club</CardTitle>
          <CardDescription className="text-zona5-cream/60">
            Tu cuenta no está vinculada a ningún club o tu membresía está inactiva.
            Contacta al propietario del club para que te dé de alta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <p className="mb-4 text-center text-sm text-zona5-cream/50">
              Sesión: {user.email}
            </p>
          )}
          <Button
            onClick={() => signOut()}
            className="w-full bg-zona5-coral text-zona5-cream hover:bg-zona5-coralDark"
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
