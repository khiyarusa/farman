import { chromium } from 'playwright';

const url = process.env.FARMAN_URL ?? 'http://127.0.0.1:5188/';
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-gl=angle', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Force auto-clutch on for this probe, then start driving.
await page.evaluate(() => {
  const app = window.__farman;
  if (app) {
    app.save.settings.assists.autoClutch = true;
    app.save.settings.assists.tcs = false;
  }
});
await page.locator('.menu-item.is-primary').click();
await page.waitForTimeout(3500);
const tutorial = page.locator('.overlay.is-open .btn--primary');
if (await tutorial.count()) await tutorial.click();
await page.waitForTimeout(300);

await page.evaluate(() => {
  const app = window.__farman;
  app.save.settings.assists.tcs = false;
});

await page.keyboard.down('ControlLeft');
await page.waitForTimeout(200);
await page.keyboard.press('KeyE');
await page.waitForTimeout(300);
await page.keyboard.up('ControlLeft');
await page.waitForTimeout(200);

for (let i = 0; i < 8; i++) {
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => {
    const d = window.__farman.debugState;
    const v = d.vehicle;
    return {
      pos: d.position,
      speed: v?.speedKph,
      rpm: v?.rpm,
      gear: v?.gear,
      clutch: v?.clutch,
      tcs: v?.tcsActive,
      driveline: d.driveline,
      body: d.body,
      torque: v?.engineTorque,
      w0: { contact: v?.wheels?.[0]?.contact, fz: v?.wheels?.[0]?.normalForce, omega: v?.wheels?.[0]?.omega, slip: v?.wheels?.[0]?.slipRatio },
      w2: { contact: v?.wheels?.[2]?.contact, fz: v?.wheels?.[2]?.normalForce, omega: v?.wheels?.[2]?.omega },
    };
  });
  console.log(JSON.stringify(s));
}
await page.keyboard.up('KeyW');
await browser.close();
