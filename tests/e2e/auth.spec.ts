import { test, expect } from "@playwright/test";

test("login page renders correctly", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(/Club de Pádel/);
  await expect(page.getByText("Iniciar sesión")).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
});

test("protected route redirects to login when not authenticated", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("login with invalid credentials shows error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("no@existe.com");
  await page.getByLabel("Contraseña").fill("wrongpassword");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(/incorrectos/i)).toBeVisible({ timeout: 10000 });
});
