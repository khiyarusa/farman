import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.env.FARMAN_URL ?? 'http://127.0.0.1:5188/';
const outDir = process.env.FARMAN_SHOTS ?? 'docs/visual-qa/dev';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', args: ['--use-gl=angle', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/10-menu.png` });

await page.locator('.menu-nav .menu-item').nth(1).click();
await page.waitForTimeout(3500);
await page.screenshot({ path: `${outDir}/11-garage.png` });

// Rotate the camera by dragging the stage.
await page.mouse.move(900, 320);
await page.mouse.down();
await page.mouse.move(700, 300, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/12-garage-angle.png` });

console.log('errors:', errors.slice(0, 8).join('\n'));
await browser.close();
