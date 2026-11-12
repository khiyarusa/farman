import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await page.goto("http://127.0.0.1:5188/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.evaluate(async () => { await window.__farman.startDrive(null); });
await page.waitForTimeout(9000);
const btn = page.locator(".overlay.is-open .btn--primary");
if (await btn.count()) { await btn.click(); await page.waitForTimeout(400); }
await page.evaluate(() => {
  const scene = window.__farman.world.scene;
  for (const name of ["terrain_grass", "terrain_rock", "terrain_dirt"]) {
    const m = scene.getMeshByName(name);
    m.material.albedoTexture = null;
    m.material.albedoColor.set(1, 0, 0);
    m.material.metallic = 0; m.material.roughness = 1;
  }
});
await page.waitForTimeout(900);
await page.screenshot({ path: "docs/visual-qa/dev/terrain-red.png" });
const px = await page.evaluate(() => {
  const c = document.getElementById("game-canvas");
  return { w: c.width, h: c.height };
});
console.log(JSON.stringify(px));
await browser.close();
