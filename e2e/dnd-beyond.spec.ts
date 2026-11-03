import { expect, test } from "@playwright/test"

import { signInAs } from "./auth"

/**
 * Connect → edit → remove on a player page. Guarded so it only runs where
 * writes are acceptable, and it removes the link it created.
 */
const allowWrites = process.env.E2E_ALLOW_WRITES === "1"

test.describe("dnd beyond link", () => {
  test.skip(!allowWrites, "Needs a writable database (E2E_ALLOW_WRITES=1)")

  test("connects, edits, and removes the link", async ({ page }) => {
    await signInAs(page, "dm@oracle.local")

    await page.goto("/players")
    const first = page
      .locator("a[href^='/players/']:not([href='/players/new'])")
      .first()
    const href = await first.getAttribute("href")
    await page.goto(href!)

    // Start from a clean slate: remove any link the seed data already has.
    const editButton = page.getByRole("button", {
      name: "Edit D&D Beyond link",
    })
    if (await editButton.count()) {
      await editButton.click()
      await page.getByRole("button", { name: "Remove link" }).click()
      await expect(
        page.getByRole("button", { name: /Connect D&D Beyond/ })
      ).toBeVisible()
    }

    // Connect.
    await page.getByRole("button", { name: /Connect D&D Beyond/ }).click()
    await page
      .getByLabel("D&D Beyond URL")
      .fill("https://www.dndbeyond.com/characters/123")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(
      page.locator("a[href='https://www.dndbeyond.com/characters/123']")
    ).toBeVisible()

    // Edit.
    await page.getByRole("button", { name: "Edit D&D Beyond link" }).click()
    await page
      .getByLabel("D&D Beyond URL")
      .fill("https://www.dndbeyond.com/characters/456")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(
      page.locator("a[href='https://www.dndbeyond.com/characters/456']")
    ).toBeVisible()

    // Remove.
    await page.getByRole("button", { name: "Edit D&D Beyond link" }).click()
    await page.getByRole("button", { name: "Remove link" }).click()
    await expect(
      page.getByRole("button", { name: /Connect D&D Beyond/ })
    ).toBeVisible()
  })
})
