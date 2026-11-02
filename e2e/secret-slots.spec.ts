import { expect, test } from "@playwright/test"

import { signInAs } from "./auth"

/**
 * Secret-slot controls round-trip, including the player's view of a revealed
 * secret. Guarded so it only runs where writes are acceptable, and it cleans up
 * after itself.
 */
const allowWrites = process.env.E2E_ALLOW_WRITES === "1"

test.describe("secret slots", () => {
  test.skip(!allowWrites, "Needs a writable database (E2E_ALLOW_WRITES=1)")

  test("marks a field secret, reveals it to players, and unmarks it", async ({
    page,
  }) => {
    await signInAs(page, "dm@oracle.local")

    const name = `E2E Secret ${Date.now()}`

    await page.goto("/characters/new")
    await page.getByLabel("Name").fill(name)
    await page.getByLabel("Alignment").fill("Lawful Good")
    await page.getByRole("combobox", { name: "Visibility" }).click()
    await page.getByRole("option", { name: "Public" }).click()
    await page.getByRole("button", { name: "Create" }).click()

    await expect(page).toHaveURL(/\/characters\/[0-9a-f-]{36}$/)
    const id = page.url().match(/\/characters\/([0-9a-f-]{36})$/)?.[1]

    await page.getByRole("link", { name: "Edit" }).click()

    // Marking moves the value into a numbered secret and nulls the column.
    await page.getByRole("button", { name: "Mark Alignment secret" }).click()
    await expect(page.getByText("Secret 1 — from alignment")).toBeVisible()

    // Raising the audience stamps revealed_at; the secret is now public.
    await page.getByRole("combobox", { name: "Audience of secret_1" }).click()
    await page.getByRole("option", { name: "Public" }).click()
    await page.getByRole("button", { name: "Set audience" }).click()
    await expect(page.getByText("public", { exact: true })).toBeVisible()

    // The dropdown itself must show the saved value, not the previous one.
    await expect(
      page.getByRole("combobox", { name: "Audience of secret_1" })
    ).toContainText("Public")

    // A reload proves the audience persisted rather than only updating state.
    await page.reload()
    await expect(page.getByText("public", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("combobox", { name: "Audience of secret_1" })
    ).toContainText("Public")

    // A player sees the revealed secret, and no DM Notes tab.
    await page.context().clearCookies()
    await signInAs(page, "player@oracle.local")
    await page.goto(`/characters/${id}`)
    await expect(page.getByRole("tab", { name: "DM Notes" })).toHaveCount(0)
    await page.getByRole("tab", { name: "Secrets" }).click()
    await expect(page.getByText("Lawful Good")).toBeVisible()

    // Back as the DM to unmark and clean up.
    await page.context().clearCookies()
    await signInAs(page, "dm@oracle.local")
    await page.goto(`/characters/${id}/edit`)
    await page.getByRole("button", { name: "Unmark Alignment secret" }).click()
    await expect(
      page.getByRole("button", { name: "Mark Alignment secret" })
    ).toBeVisible()

    await page.goto(`/characters/${id}`)
    await page.getByRole("button", { name: "Delete" }).click()
    await page
      .getByRole("button", { name: "Delete", exact: true })
      .last()
      .click()

    await expect(page).toHaveURL(/\/characters$/)
  })
})
