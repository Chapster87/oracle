import { expect, test } from "@playwright/test"

import { signInAs } from "./auth"

/**
 * A new entity defaults to private, so a player cannot see it. Guarded so it
 * only runs where writes are acceptable, and it deletes what it created.
 */
const allowWrites = process.env.E2E_ALLOW_WRITES === "1"

test.describe("private by default", () => {
  test.skip(!allowWrites, "Needs a writable database (E2E_ALLOW_WRITES=1)")

  test("creates a private entity a player cannot see", async ({ page }) => {
    await signInAs(page, "dm@oracle.local")

    const name = `E2E Private ${Date.now()}`

    await page.goto("/characters/new")
    await page.getByLabel("Name").fill(name)
    await page.getByRole("button", { name: "Create" }).click()

    await expect(page).toHaveURL(/\/characters\/[0-9a-f-]{36}$/)
    const id = page.url().match(/\/characters\/([0-9a-f-]{36})$/)?.[1]

    await expect(page.getByText("Private", { exact: true })).toBeVisible()

    // A player gets a 404 rather than the entity.
    await page.context().clearCookies()
    await signInAs(page, "player@oracle.local")
    const response = await page.goto(`/characters/${id}`)
    expect(response?.status()).toBe(404)

    // Back as the DM to clean up.
    await page.context().clearCookies()
    await signInAs(page, "dm@oracle.local")
    await page.goto(`/characters/${id}`)
    await page.getByRole("button", { name: "Delete" }).click()
    await page
      .getByRole("button", { name: "Delete", exact: true })
      .last()
      .click()

    await expect(page).toHaveURL(/\/characters$/)
  })
})
