import { cn } from "@/lib/utils";

export function EmptyState({
  title = "Sin movimientos aún",
  description,
  icon,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function LoadingState({ message = "Cargando…" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

export function ErrorState({
  message = "Ocurrió un error al cargar los datos.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
