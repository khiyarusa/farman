import { PHYSICS } from './config';
import { clamp } from './math';

/**
 * Fixed-timestep accumulator with a bounded catch-up budget.
 *
 * Rendering interpolation uses `alpha` = fraction of the next physics step that
 * has already elapsed. Simulation code must never read wall-clock time.
 */
export class FixedStepLoop {
  readonly dt = PHYSICS.dt;
  private accumulator = 0;
  private running = false;
  private lastTime = 0;
  private stepCount = 0;

  /** Last measured frame delta after clamping (seconds). */
  lastDelta = 0;
  /** Number of physics steps executed in the most recent advance(). */
  lastSteps = 0;
  /** Interpolation factor in [0,1). */
  alpha = 0;

  get steps(): number {
    return this.stepCount;
  }

  start(nowMs: number): void {
    this.running = true;
    this.lastTime = nowMs;
    this.accumulator = 0;
  }

  stop(): void {
    this.running = false;
  }

  /**
   * Advances the accumulator. Returns how many fixed steps the caller must run.
   * The caller runs `step()` that many times and then reads `alpha`.
   */
  advance(nowMs: number): number {
    if (!this.running) return 0;
    const raw = (nowMs - this.lastTime) / 1000;
    this.lastTime = nowMs;
    // A tab switch or a GC pause must not produce a physics explosion.
    const delta = clamp(raw, 0, PHYSICS.maxFrameDelta);
    this.lastDelta = delta;
    this.accumulator += delta;

    const maxAccum = PHYSICS.dt * PHYSICS.maxStepsPerFrame;
    if (this.accumulator > maxAccum) {
      // Discard the backlog we cannot afford; keeps real-time pacing sane.
      this.accumulator = maxAccum;
    }

    let steps = 0;
    while (this.accumulator >= this.dt && steps < PHYSICS.maxStepsPerFrame) {
      this.accumulator -= this.dt;
      steps++;
    }
    this.stepCount += steps;
    this.lastSteps = steps;
    this.alpha = this.accumulator / this.dt;
    return steps;
  }

  /** Called after a long pause (Android background/resume) to resynchronise. */
  resync(nowMs: number): void {
    this.lastTime = nowMs;
    this.accumulator = 0;
    this.alpha = 0;
  }
}
