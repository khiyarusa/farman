import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await page.goto("http://127.0.0.1:5188/", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.locator(".menu-nav .menu-item").first().click();
await page.waitForTimeout(9000);
const t = await page.locator(".overlay.is-open .btn--primary");
if (await t.count()) { await t.click(); await page.waitForTimeout(600); }
await page.evaluate(() => {
  const app = window.__farman;
  const scene = app.world.scene;
  const sky = scene.getMeshByName("sky");
  sky.material.emissiveColor.set(1, 0, 0);
  sky.material.emissiveTexture = null;
});
await page.waitForTimeout(600);
await page.screenshot({ path: "docs/visual-qa/dev/sky-red.png" });
await browser.close();
