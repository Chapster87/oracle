import { expect, test } from "@playwright/test"

/**
 * Create → edit → delete round-trip through the shared form. Guarded so it only
 * runs where writes are acceptable, and it cleans up after itself.
 */
const allowWrites = process.env.E2E_ALLOW_WRITES === "1"

test.describe("entity form", () => {
  test.skip(!allowWrites, "Needs a writable database (E2E_ALLOW_WRITES=1)")

  test("creates, edits, and deletes a character", async ({ page }) => {
    const name = `E2E Character ${Date.now()}`

    await page.goto("/characters/new")
    await page.getByLabel("Name").fill(name)
    await page.getByRole("button", { name: "Create" }).click()

    await expect(page).toHaveURL(/\/characters\/[0-9a-f-]{36}$/)
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible()

    await page.getByRole("link", { name: "Edit" }).click()
    await page.getByLabel("Name").fill(`${name} edited`)
    await page.getByRole("button", { name: "Save changes" }).click()

    await expect(
      page.getByRole("heading", { level: 1, name: `${name} edited` })
    ).toBeVisible()

    await page.getByRole("button", { name: "Delete" }).click()
    await page
      .getByRole("button", { name: "Delete", exact: true })
      .last()
      .click()

    await expect(page).toHaveURL(/\/characters$/)
  })
})
