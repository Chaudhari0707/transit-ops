import { type Page } from "@playwright/test";

export async function gotoRoute(page: Page, path: string) {
  try {
    await page.goto(path, { waitUntil: "commit" });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes("net::ERR_ABORTED")) {
      throw error;
    }
  }
}
