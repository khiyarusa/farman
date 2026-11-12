import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
const logs = [];
page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
await page.goto("http://127.0.0.1:5188/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.locator(".menu-nav .menu-item").first().click();
await page.waitForTimeout(12000);
const t = await page.locator(".overlay.is-open .btn--primary");
if (await t.count()) { await t.click(); await page.waitForTimeout(800); }
const sky = await page.evaluate(() => {
  const app = window.__farman;
  const scene = app.world?.scene;
  const names = scene ? scene.meshes.map((m) => m.name) : [];
  const skydome = scene?.getMeshByName("sky");
  return { count: names.length, names: names.slice(0, 12), skyMat: skydome?.material?.name, hasTex: !!(skydome?.material && skydome.material.emissiveTexture) };
});
console.log(JSON.stringify(sky));
console.log(logs.filter((l) => l.includes("error") || l.includes("warn")).slice(0, 10).join("\n"));
await browser.close();
