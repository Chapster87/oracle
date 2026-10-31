import { expect, test } from "@playwright/test"

test("the component workbench renders", async ({ page }) => {
  await page.goto("/components/dnd-beyond")
  await expect(
    page.getByRole("heading", { name: "D&D Beyond" })
  ).toBeVisible()
})
