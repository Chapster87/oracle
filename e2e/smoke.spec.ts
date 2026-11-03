import { expect, test } from "@playwright/test"

import { signInAs } from "./auth"

test("the component workbench renders", async ({ page }) => {
  await signInAs(page, "dm@oracle.local")

  await page.goto("/components/dnd-beyond")
  await expect(page.getByRole("heading", { name: "D&D Beyond" })).toBeVisible()
})
