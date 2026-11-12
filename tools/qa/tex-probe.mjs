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
  for (const m of scene.meshes.slice(0, 8)) {
    const mat = m.material;
    out.push({ name: m.name, mat: mat?.name, tex: mat?.albedoTexture?.url ?? null, ready: mat?.albedoTexture?.isReady?.() ?? null, color: mat?.albedoColor?.asArray?.().map(v=>+v.toFixed(2)) ?? null });
  }
  return out;
});
console.log(JSON.stringify(info, null, 1).slice(0, 2000));
await browser.close();
