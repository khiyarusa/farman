import { chromium } from 'playwright';

const url = process.env.FARMAN_URL ?? 'http://127.0.0.1:5188/';
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-gl=angle', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Persistence check: the save exists and survives a reload.
const before = await page.evaluate(() => {
  const raw = localStorage.getItem('farman.save.v1');
  return raw ? JSON.parse(raw).player.credits : null;
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const after = await page.evaluate(() => {
  const raw = localStorage.getItem('farman.save.v1');
  return raw ? JSON.parse(raw).player.credits : null;
});
console.log('credits before/after reload:', before, after);

await page.evaluate(async () => { await window.__farman.startDrive('parking'); });
await page.waitForTimeout(9000);
const btn = page.locator('.overlay.is-open .btn--primary');
if (await btn.count()) { await btn.click(); await page.waitForTimeout(400); }

// Teleport into the parking target zone, then stop.
const status = await page.evaluate(async () => {
  const app = window.__farman;
  const spawn = app.world.spawnFor('city-parking');
  const yaw = spawn.yaw;
  app.vehicle.setPose(spawn.x + Math.sin(yaw) * 34, spawn.y + 0.05, spawn.z + Math.cos(yaw) * 34, yaw);
  app.world.camera.snap(app.vehicle);
  await new Promise((r) => setTimeout(r, 2600));
  return {
    mission: app.mission?.id,
    status: app.missionRunner?.status,
    elapsed: app.missionRunner?.elapsed,
    result: app.missionRunner?.result?.(),
  };
});
console.log('mission:', JSON.stringify(status));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'docs/visual-qa/v0.1.0/screenshots/17-mission-result.png' });
console.log('errors', errors.slice(0, 5));
await browser.close();
