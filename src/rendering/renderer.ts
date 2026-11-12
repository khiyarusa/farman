import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import type { GraphicsProfile, Settings } from '../save/schema';
import { RENDER } from '../core/config';

/**
 * Owns the WebGL engine, the active scene and quality scaling.
 * One engine for the whole app; scenes are swapped (studio ↔ world) without
 * recreating the WebGL context, which is what keeps Android WebView happy.
 */
export class Renderer {
  readonly engine: Engine;
  readonly canvas: HTMLCanvasElement;
  scene: Scene | null = null;
  private quality: GraphicsProfile = 'balanced';
  private renderScale = 1;
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    this.canvas = canvas;
    this.engine = new Engine(
      canvas,
      true,
      {
        stencil: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        premultipliedAlpha: false,
        doNotHandleContextLost: false,
        failIfMajorPerformanceCaveat: false,
      },
      true,
    );
    this.engine.enableOfflineSupport = false;
    this.engine.disableManifestCheck = true;
    this.applySettings(settings);

    const onResize = (): void => {
      this.engine.resize();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(document.documentElement);
    }
  }

  applySettings(settings: Settings): void {
    this.quality = settings.graphics;
    this.renderScale = settings.renderScale;
    this.updateScaling();
  }

  private updateScaling(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio[this.quality]);
    const scale = dpr * RENDER.renderScale[this.quality] * (this.renderScale || 1);
    this.engine.setHardwareScalingLevel(1 / Math.max(0.55, scale));
  }

  setScene(scene: Scene | null): void {
    if (this.scene && this.scene !== scene) {
      this.scene.dispose();
    }
    this.scene = scene;
  }

  start(onFrame?: () => void): void {
    this.engine.runRenderLoop(() => {
      onFrame?.();
      const scene = this.scene;
      if (scene && scene.activeCamera) scene.render();
    });
  }

  stop(): void {
    this.engine.stopRenderLoop();
  }

  dispose(): void {
    this.stop();
    this.scene?.dispose();
    this.scene = null;
    this.resizeObserver?.disconnect();
    this.engine.dispose();
  }
}
