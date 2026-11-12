import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
const responses = [];
page.on("response", (r) => { if (r.url().includes("sky")) responses.push(r.status() + " " + r.url()); });
await page.goto("http://127.0.0.1:5188/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.locator(".menu-nav .menu-item").first().click();
await page.waitForTimeout(10000);
const info = await page.evaluate(() => {
  const app = window.__farman;
  const scene = app.world?.scene;
  const m = scene?.getMeshByName("sky")?.material;
  const t = m?.emissiveTexture;
  return t ? { url: t.url, ready: t.isReady(), size: t.getSize(), vScale: t.vScale } : null;
});
console.log(JSON.stringify(responses));
console.log(JSON.stringify(info));
await browser.close();
