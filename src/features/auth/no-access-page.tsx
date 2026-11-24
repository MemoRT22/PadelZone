import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

export function NoAccessPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldX className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl">Sin acceso al club</CardTitle>
          <CardDescription>
            Tu cuenta no está vinculada a ningún club o tu membresía está inactiva.
            Contacta al propietario del club para que te dé de alta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Sesión: {user.email}
            </p>
          )}
          <Button
            onClick={() => signOut()}
            className="w-full"
            variant="outline"
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
