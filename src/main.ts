import './ui/design.css';
import { App } from './app';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
const uiRoot = document.getElementById('ui-root') as HTMLElement | null;
const bootStatus = document.getElementById('boot-status');
const bootProgress = document.getElementById('boot-progress');
const boot = document.getElementById('boot');

function setBoot(text: string, fraction: number): void {
  if (bootStatus) bootStatus.textContent = text;
  if (bootProgress) bootProgress.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
}

function showFatal(message: string): void {
  if (!boot) return;
  boot.classList.remove('is-hidden');
  boot.innerHTML = `
    <div class="boot-mark">!</div>
    <div class="boot-title" style="font-size:1.6rem">خطا</div>
    <div class="boot-status" style="max-width:32rem;text-align:center;line-height:1.9">${message}</div>
  `;
}

async function main(): Promise<void> {
  if (!canvas || !uiRoot) {
    showFatal('ساختار صفحه کامل نیست.');
    return;
  }

  // WebGL2 is the baseline for the Android WebView target.
  const probe = canvas.getContext('webgl2');
  if (!probe) {
    showFatal('مرورگر یا دستگاه شما WebGL2 را پشتیبانی نمی‌کند. لطفاً مرورگر را به‌روزرسانی کنید.');
    return;
  }

  setBoot('در حال شروع…', 0.05);
  const app = new App(canvas, uiRoot);

  try {
    await app.boot((text, fraction) => setBoot(text, fraction));
    boot?.classList.add('is-hidden');
    setTimeout(() => boot?.remove(), 700);
  } catch (err) {
    console.error('[farman] boot failed', err);
    showFatal(`بارگذاری بازی ناموفق بود: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Debug handle used by automated visual QA (Playwright) and the developer overlay.
  (window as unknown as { __farman?: unknown }).__farman = app;
}

void main();
