import { expect, test } from "@playwright/test"

import { signInAs } from "./auth"

/** A player sees no write affordance on an entity page. */
test.describe("player read-only", () => {
  test("hides connect, edit, and delete from a player", async ({ page }) => {
    await signInAs(page, "player@oracle.local")

    await page.goto("/players")
    const first = page
      .locator("a[href^='/players/']:not([href='/players/new'])")
      .first()
    const href = await first.getAttribute("href")
    await page.goto(href!)

    await expect(
      page.getByRole("button", { name: /Connect D&D Beyond/ })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Edit D&D Beyond link" })
    ).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0)
    await expect(page.getByRole("tab", { name: "DM Notes" })).toHaveCount(0)
  })
})
