import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.env.FARMAN_URL ?? 'http://127.0.0.1:5188/';
const outDir = process.env.FARMAN_SHOTS ?? 'docs/visual-qa/dev';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', args: ['--use-gl=angle', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });

const logs = [];
page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.screenshot({ path: `${outDir}/01-menu.png` });

await page.locator('.menu-item.is-primary').click();
await page.waitForTimeout(4000);

// Dismiss the tutorial if it is open.
const tutorialButton = page.locator('.overlay.is-open .btn--primary');
if (await tutorialButton.count()) {
  await tutorialButton.click();
  await page.waitForTimeout(500);
}
await page.screenshot({ path: `${outDir}/02-drive.png` });

// Drive straight ahead for a few seconds (keyboard), then capture.
await page.keyboard.down('ControlLeft');
await page.keyboard.press('KeyE');
await page.waitForTimeout(320);
await page.keyboard.up('ControlLeft');
await page.keyboard.down('KeyW');
await page.waitForTimeout(3200);
await page.screenshot({ path: `${outDir}/03-driving.png` });
const state = await page.evaluate(() => (window.__farman ? window.__farman.debugState : null));
await page.keyboard.up('KeyW');
console.log(JSON.stringify(state, null, 2)?.slice(0, 1200));

console.log('--- console ---');
console.log(logs.slice(0, 25).join('\n'));
await browser.close();
