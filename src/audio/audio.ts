import type { VehicleTelemetry } from '../vehicles/vehicle';

/**
 * Procedural audio: engine, transmission whine, tyres, wind and rain.
 *
 * Everything is synthesised at runtime with the Web Audio API, so the game ships
 * no third-party recordings and the engine note follows the actual firing
 * frequency of each vehicle's cylinder count instead of looping one sample.
 *
 * The context is created on the first user gesture (browser autoplay policy) and
 * suspended when the game is paused or the app is backgrounded.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private engineBus!: GainNode;
  private tireBus!: GainNode;
  private ambienceBus!: GainNode;
  private uiBus!: GainNode;

  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private engineFilter!: BiquadFilterNode;
  private engineGain!: GainNode;

  private tireNoise: AudioBufferSourceNode | null = null;
  private tireFilter!: BiquadFilterNode;
  private tireGain!: GainNode;

  private windNoise: AudioBufferSourceNode | null = null;
  private windFilter!: BiquadFilterNode;
  private windGain!: GainNode;

  private rainNoise: AudioBufferSourceNode | null = null;
  private rainGain!: GainNode;

  private noiseBuffer: AudioBuffer | null = null;
  private started = false;
  private muted = false;

  get running(): boolean {
    return this.started && this.ctx?.state === 'running';
  }

  /** Must be called from a user gesture (pointerdown/keydown). */
  async start(): Promise<void> {
    if (this.started) {
      await this.ctx?.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    this.engineBus = ctx.createGain();
    this.engineBus.gain.value = 0.0;
    this.engineBus.connect(this.master);
    this.tireBus = ctx.createGain();
    this.tireBus.gain.value = 0.0;
    this.tireBus.connect(this.master);
    this.ambienceBus = ctx.createGain();
    this.ambienceBus.gain.value = 0.0;
    this.ambienceBus.connect(this.master);
    this.uiBus = ctx.createGain();
    this.uiBus.gain.value = 0.5;
    this.uiBus.connect(this.master);

    // --- engine voice -----------------------------------------------------
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 800;
    this.engineFilter.Q.value = 1.1;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.0;
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.engineBus);

    this.oscA = ctx.createOscillator();
    this.oscA.type = 'sawtooth';
    this.oscA.frequency.value = 40;
    this.oscA.connect(this.engineFilter);
    this.oscB = ctx.createOscillator();
    this.oscB.type = 'square';
    this.oscB.frequency.value = 80;
    const bGain = ctx.createGain();
    bGain.gain.value = 0.35;
    this.oscB.connect(bGain);
    bGain.connect(this.engineFilter);
    this.oscSub = ctx.createOscillator();
    this.oscSub.type = 'sine';
    this.oscSub.frequency.value = 20;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;
    this.oscSub.connect(subGain);
    subGain.connect(this.engineGain);

    // --- noise buffer ------------------------------------------------------
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;

    // --- tyres -------------------------------------------------------------
    this.tireFilter = ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.value = 900;
    this.tireFilter.Q.value = 0.8;
    this.tireGain = ctx.createGain();
    this.tireGain.gain.value = 0;
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.tireBus);
    this.tireNoise = this.loopNoise();
    this.tireNoise.connect(this.tireFilter);

    // --- wind --------------------------------------------------------------
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 500;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambienceBus);
    this.windNoise = this.loopNoise();
    this.windNoise.connect(this.windFilter);

    // --- rain --------------------------------------------------------------
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.ambienceBus);
    this.rainNoise = this.loopNoise();
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1200;
    this.rainNoise.connect(rainFilter);
    rainFilter.connect(this.rainGain);

    this.oscA.start();
    this.oscB.start();
    this.oscSub.start();
    this.tireNoise.start();
    this.windNoise.start();
    this.rainNoise.start();
    this.started = true;
  }

  private loopNoise(): AudioBufferSourceNode {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  setVolumes(master: number, engine: number, ambience: number, ui: number): void {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, master)), this.ctx.currentTime, 0.05);
    this.engineBus.gain.setTargetAtTime(Math.max(0, Math.min(1, engine)), this.ctx.currentTime, 0.1);
    this.ambienceBus.gain.setTargetAtTime(Math.max(0, Math.min(1, ambience)), this.ctx.currentTime, 0.2);
    this.uiBus.gain.setTargetAtTime(Math.max(0, Math.min(1, ui)), this.ctx.currentTime, 0.05);
  }

  update(t: VehicleTelemetry, firingHzAt1000: number, surface: string, wet: boolean, paused: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.started) return;
    const now = ctx.currentTime;
    if (paused) {
      this.engineBus.gain.setTargetAtTime(0, now, 0.08);
      this.tireBus.gain.setTargetAtTime(0, now, 0.08);
      this.ambienceBus.gain.setTargetAtTime(0, now, 0.2);
      return;
    }
    const rpm = Math.max(0, t.rpm);
    const f = Math.max(18, (rpm / 1000) * firingHzAt1000);
    const throttle = t.throttle;
    const speed = t.speedKph;

    if (this.oscA && this.oscB && this.oscSub) {
      this.oscA.frequency.setTargetAtTime(f, now, 0.02);
      this.oscB.frequency.setTargetAtTime(f * 2.02, now, 0.02);
      this.oscSub.frequency.setTargetAtTime(f * 0.5, now, 0.03);
    }
    const load = 0.25 + throttle * 0.75;
    this.engineFilter.frequency.setTargetAtTime(320 + rpm * 0.35 + throttle * 900, now, 0.05);
    this.engineGain.gain.setTargetAtTime(t.stalled ? 0 : 0.05 + load * 0.16, now, 0.06);

    // Tyres: speed noise plus slip squeal.
    const slip = Math.max(...t.wheels.map((w) => Math.abs(w.slipRatio)), 0);
    const dirt = surface === 'dirt' || surface === 'gravel' ? 1 : 0;
    this.tireGain.gain.setTargetAtTime(Math.min(0.22, speed / 900 + slip * 0.12), now, 0.08);
    this.tireFilter.frequency.setTargetAtTime(700 + slip * 900 + dirt * 250, now, 0.1);

    this.windGain.gain.setTargetAtTime(Math.min(0.18, speed / 700), now, 0.15);
    this.windFilter.frequency.setTargetAtTime(300 + speed * 4, now, 0.2);
    this.rainGain.gain.setTargetAtTime(wet ? 0.10 : 0, now, 0.5);
  }

  ui(kind: 'click' | 'confirm' | 'error' = 'click'): void {
    const ctx = this.ctx;
    if (!ctx || !this.started) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const freq = kind === 'confirm' ? 660 : kind === 'error' ? 180 : 420;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.uiBus);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  async suspend(): Promise<void> {
    await this.ctx?.suspend();
  }

  async resume(): Promise<void> {
    await this.ctx?.resume();
  }

  /** Fades the driving beds out when the player leaves the road. */
  silence(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.engineBus.gain.setTargetAtTime(0, now, 0.15);
    this.tireBus.gain.setTargetAtTime(0, now, 0.15);
    this.ambienceBus.gain.setTargetAtTime(0, now, 0.3);
  }

  mute(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx?.currentTime ?? 0, 0.05);
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
