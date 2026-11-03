import { expect, test } from "@playwright/test"

import { signInAs } from "./auth"

/**
 * Destructive flow. Guarded so it only runs where writes are acceptable, and it
 * creates the entity it deletes rather than touching seeded data.
 */
const allowWrites = process.env.E2E_ALLOW_WRITES === "1"

test.describe("delete entity", () => {
  test.skip(!allowWrites, "Needs a writable database (E2E_ALLOW_WRITES=1)")

  test("deletes an entity and returns to the directory", async ({ page }) => {
    await signInAs(page, "dm@oracle.local")

    const name = `E2E Delete ${Date.now()}`

    await page.goto("/characters/new")
    await page.getByLabel("Name").fill(name)
    await page.getByRole("button", { name: "Create" }).click()

    await expect(page).toHaveURL(/\/characters\/[0-9a-f-]{36}$/)

    await page.getByRole("button", { name: "Delete" }).click()
    await page
      .getByRole("button", { name: "Delete", exact: true })
      .last()
      .click()

    await expect(page).toHaveURL(/\/characters$/)
  })
})
