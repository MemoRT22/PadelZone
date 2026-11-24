import { describe, it, expect } from "vitest";
import {
  roleLabel,
  canManageStaff,
  canManageCourts,
  canManageCatalog,
  canManagePlayers,
  canManageSettings,
  canEditPrices,
} from "@/lib/auth/permissions";
import type { ClubRole } from "@/types/database";

describe("roleLabel", () => {
  it("returns correct labels for all roles", () => {
    expect(roleLabel("propietario")).toBe("Propietario");
    expect(roleLabel("gerente")).toBe("Gerente");
    expect(roleLabel("cajero")).toBe("Cajero");
    expect(roleLabel("cocina")).toBe("Cocina");
    expect(roleLabel("entrenador")).toBe("Entrenador");
    expect(roleLabel("organizador")).toBe("Organizador");
  });
});

describe("canManageStaff", () => {
  it("allows propietario only", () => {
    expect(canManageStaff("propietario")).toBe(true);
    expect(canManageStaff("gerente")).toBe(false);
    expect(canManageStaff("cajero")).toBe(false);
    expect(canManageStaff(undefined)).toBe(false);
  });
});

describe("canManageCourts", () => {
  it("allows propietario and gerente", () => {
    const roles: ClubRole[] = ["propietario", "gerente"];
    roles.forEach((r) => expect(canManageCourts(r)).toBe(true));
    expect(canManageCourts("cajero")).toBe(false);
  });
});

describe("canManageCatalog", () => {
  it("allows propietario and gerente", () => {
    expect(canManageCatalog("propietario")).toBe(true);
    expect(canManageCatalog("gerente")).toBe(true);
    expect(canManageCatalog("cajero")).toBe(false);
  });
});

describe("canManagePlayers", () => {
  it("allows propietario, gerente, cajero", () => {
    expect(canManagePlayers("propietario")).toBe(true);
    expect(canManagePlayers("gerente")).toBe(true);
    expect(canManagePlayers("cajero")).toBe(true);
    expect(canManagePlayers("cocina")).toBe(false);
  });
});

describe("canManageSettings", () => {
  it("allows propietario only", () => {
    expect(canManageSettings("propietario")).toBe(true);
    expect(canManageSettings("gerente")).toBe(false);
  });
});

describe("canEditPrices", () => {
  it("allows propietario and gerente only", () => {
    expect(canEditPrices("propietario")).toBe(true);
    expect(canEditPrices("gerente")).toBe(true);
    expect(canEditPrices("cajero")).toBe(false);
  });
});
