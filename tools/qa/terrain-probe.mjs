import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await page.goto("http://127.0.0.1:5188/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.evaluate(async () => { await window.__farman.startDrive(null); });
await page.waitForTimeout(9000);
const info = await page.evaluate(() => {
  const scene = window.__farman.world.scene;
  const out = [];
  for (const name of ["terrain_grass", "terrain_rock", "terrain_dirt", "roads"]) {
    const m = scene.getMeshByName(name);
    if (!m) { out.push({ name, missing: true }); continue; }
    m.material.albedoTexture = null;
    m.material.albedoColor.set(1, 0, 0);
    m.material.emissiveColor = m.material.emissiveColor ?? null;
    out.push({ name, visible: m.isVisible, enabled: m.isEnabled(), verts: m.getTotalVertices(), idx: m.getTotalIndices(), y: m.getBoundingInfo().boundingBox.minimumWorld.y });
  }
  return out;
});
console.log(JSON.stringify(info));
await page.waitForTimeout(800);
await page.screenshot({ path: "docs/visual-qa/dev/terrain-red.png" });
await browser.close();
