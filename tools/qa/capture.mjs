import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.FARMAN_URL ?? 'http://127.0.0.1:5188/';
const out = process.env.FARMAN_SHOTS ?? 'docs/visual-qa/v0.1.0/screenshots';
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.FARMAN_BROWSER ?? 'msedge',
  args: ['--use-gl=angle', '--use-angle=d3d11'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const shot = async (name, ms = 400) => {
  await page.waitForTimeout(ms);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log('captured', name);
};

const dismissTutorial = async () => {
  const btn = page.locator('.overlay.is-open .btn--primary');
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(400);
  }
};

const startFreeDrive = async (vehicleId = null) => {
  await page.evaluate(async (id) => {
    const app = window.__farman;
    if (id) app.selectVehicle(id);
    await app.startDrive(null);
  }, vehicleId);
  await page.waitForTimeout(1200);
  await dismissTutorial();
};

const teleport = async (spawnId, ms = 900) => {
  await page.evaluate((id) => {
    const app = window.__farman;
    const spawn = app.world.spawnFor(id);
    if (!spawn) return;
    app.vehicle.setPose(spawn.x, spawn.y + 0.05, spawn.z, spawn.yaw);
    app.world.camera.snap(app.vehicle);
  }, spawnId);
  await page.waitForTimeout(ms);
};

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await shot('01-menu');

// ---- garage -------------------------------------------------------------
await page.locator('.menu-nav .menu-item').nth(1).click();
await page.waitForTimeout(3000);
await shot('02-garage', 600);
await page.mouse.move(900, 330);
await page.mouse.down();
await page.mouse.move(760, 310, { steps: 10 });
await page.mouse.up();
await shot('03-garage-angle', 900);

// ---- missions and settings ---------------------------------------------
await page.evaluate(() => window.__farman.goMissions());
await shot('04-missions', 700);
await page.evaluate(() => window.__farman.goSettings());
await shot('05-settings', 700);

// ---- free drive, manual -------------------------------------------------
await page.evaluate(() => window.__farman.goMenu());
await page.waitForTimeout(600);
await startFreeDrive('pride-131');
await shot('06-city-manual', 800);
await page.keyboard.down('ControlLeft');
await page.keyboard.press('KeyE');
await page.keyboard.up('ControlLeft');
await page.keyboard.down('KeyW');
await page.waitForTimeout(2600);
await shot('07-driving-manual', 200);
await page.keyboard.up('KeyW');

// ---- highway ------------------------------------------------------------
await teleport('highway-time');
await shot('08-highway', 900);

// ---- mountain -----------------------------------------------------------
await teleport('mountain-hillstart');
await shot('09-mountain', 1200);

// ---- rain ---------------------------------------------------------------
await page.evaluate(() => window.__farman.world.setWeather('rain'));
await shot('10-rain', 1200);

// ---- traffic (city, close to the AI cars) -------------------------------
await teleport('city-traffic');
await page.waitForTimeout(1500);
await shot('11-traffic', 500);

// ---- pause --------------------------------------------------------------
await page.evaluate(() => window.__farman.pauseGame());
await shot('12-pause', 600);
await page.evaluate(() => window.__farman.resume());

// ---- automatic gearbox HUD ---------------------------------------------
await page.evaluate(() => window.__farman.exitDrive());
await page.waitForTimeout(900);
await startFreeDrive('bmw-320i');
await page.keyboard.down('KeyW');
await page.waitForTimeout(2400);
await shot('13-automatic', 200);
await page.keyboard.up('KeyW');

// ---- mission start + objective -----------------------------------------
await page.evaluate(() => window.__farman.exitDrive());
await page.waitForTimeout(700);
await page.evaluate(async () => {
  await window.__farman.startDrive('parking');
});
await page.waitForTimeout(2000);
await dismissTutorial();
await shot('14-mission-objective', 800);

// ---- wheel / road contact close-up -------------------------------------
await page.evaluate(() => {
  const app = window.__farman;
  const cam = app.world.camera.camera;
  const v = app.vehicle.position;
  cam.position.set(v.x + 2.4, v.y + 0.55, v.z + 1.8);
  const target = cam.position.clone();
  target.set(v.x, v.y + 0.35, v.z);
  cam.setTarget(target);
  app.world.camera.setMode('close');
});
await shot('15-wheel-contact', 900);

// ---- mobile aspect ratio ------------------------------------------------
await page.setViewportSize({ width: 2400, height: 1080 });
await page.waitForTimeout(900);
await shot('16-mobile-2400x1080', 600);

const state = await page.evaluate(() => window.__farman.debugState);
await writeFile(`${out}/../capture-state.json`, JSON.stringify(state, null, 2));
console.log('errors:', errors.length);
console.log(errors.slice(0, 12).join('\n'));
await browser.close();
