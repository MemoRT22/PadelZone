import type { ClubRole } from "@/types/database";

export function roleLabel(role: ClubRole): string {
  const labels: Record<ClubRole, string> = {
    propietario: "Propietario",
    gerente: "Gerente",
    cajero: "Cajero",
    cocina: "Cocina",
    entrenador: "Entrenador",
    organizador: "Organizador",
  };
  return labels[role] ?? role;
}

export function canManageStaff(role: ClubRole | undefined): boolean {
  return role === "propietario";
}

export function canManageCourts(role: ClubRole | undefined): boolean {
  return role === "propietario" || role === "gerente";
}

export function canManageCatalog(role: ClubRole | undefined): boolean {
  return role === "propietario" || role === "gerente";
}

export function canManagePlayers(role: ClubRole | undefined): boolean {
  return (
    role === "propietario" || role === "gerente" || role === "cajero"
  );
}

export function canManageSettings(role: ClubRole | undefined): boolean {
  return role === "propietario";
}

export function canEditPrices(role: ClubRole | undefined): boolean {
  return role === "propietario" || role === "gerente";
}

export function canViewStaff(role: ClubRole | undefined): boolean {
  return role === "propietario";
}

export function canManageReservations(role: ClubRole | undefined): boolean {
  return role === "propietario" || role === "gerente" || role === "cajero";
}

export function canManageBlocks(role: ClubRole | undefined): boolean {
  return role === "propietario" || role === "gerente";
}

export function canViewAgenda(role: ClubRole | undefined): boolean {
  return role !== undefined;
}
