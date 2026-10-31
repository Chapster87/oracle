import { expect, test } from "@playwright/test"

/**
 * Destructive flow. Guarded so it only runs against a seeded test database,
 * never the live campaign data.
 */
const allowWrites = process.env.E2E_ALLOW_WRITES === "1"

test.describe("delete entity", () => {
  test.skip(!allowWrites, "Needs a seeded test database (E2E_ALLOW_WRITES=1)")

  test("deletes an entity and returns to the directory", async ({ page }) => {
    await page.goto("/players")
    const first = page.locator("a[href^='/players/']").first()
    const href = await first.getAttribute("href")
    expect(href).toBeTruthy()

    await page.goto(href!)
    await page.getByRole("button", { name: "Delete" }).click()
    await page.getByRole("button", { name: "Delete", exact: true }).last().click()

    await expect(page).toHaveURL(/\/players$/)
  })
})
