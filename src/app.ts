import { APP, GAME, PHYSICS } from './core/config';
import { FixedStepLoop } from './core/loop';
import { clamp } from './core/math';
import { PhysicsWorld } from './physics/world';
import { Renderer } from './rendering/renderer';
import { StudioScene } from './rendering/studio';
import { WorldScene } from './rendering/worldScene';
import { CameraRig } from './rendering/cameraRig';
import { SaveStore } from './save/storage';
import { createDefaultSave, type Settings, type VehicleState } from './save/schema';
import { getProfile, VEHICLE_PROFILES } from './vehicles/profiles';
import { VehicleSim } from './vehicles/vehicle';
import type { VehicleProfile } from './vehicles/profile';
import { TouchControls, type ControlAction } from './input/controls';
import { KeyboardInput } from './input/keyboard';
import { UIRoot } from './ui/ui';
import { Hud } from './ui/screens/hud';
import { menuScreen } from './ui/screens/menu';
import { garageScreen } from './ui/screens/garage';
import { missionsScreen } from './ui/screens/missions';
import { settingsScreen } from './ui/screens/settings';
import { confirmOverlay, helpScreen, pauseOverlay, resultsOverlay, tutorialOverlay } from './ui/screens/overlays';
import { getMission, type MissionDef } from './missions/definitions';
import { MissionManager, type MissionResult } from './missions/manager';
import { TrafficSystem } from './traffic/traffic';
import { AudioEngine } from './audio/audio';
import { FA } from './ui/i18n';
import { el } from './ui/dom';
import { formatNumber, setDigitMode } from './ui/format';
import type { VehicleView } from './rendering/vehicleView';


/**
 * Application orchestrator: owns the scene lifecycle, the fixed-step loop and
 * all screen transitions. Simulation code never touches the DOM directly.
 */
export class App {
  readonly ui: UIRoot;
  readonly saveStore: SaveStore;
  readonly renderer: Renderer;
  readonly version = APP.version;
  readonly audio = new AudioEngine();
  isNative = false;

  private physics: PhysicsWorld;
  private studio: StudioScene | null = null;
  private world: WorldScene | null = null;
  private vehicle: VehicleSim | null = null;
  private vehicleView: VehicleView | null = null;
  private hud: Hud | null = null;
  private controls: TouchControls | null = null;
  private keyboard: KeyboardInput | null = null;
  private missionRunner: MissionManager | null = null;
  private mission: MissionDef | null = null;
  private traffic: TrafficSystem | null = null;
  private loop = new FixedStepLoop();
  private mode: 'boot' | 'menu' | 'drive' | 'loading' = 'boot';
  private paused = false;
  private lastFrame = 0;
  private missionEndTimer = 0;
  private loadingEl: HTMLElement | null = null;
  private loadingBar: HTMLElement | null = null;
  private loadingLabel: HTMLElement | null = null;
  onScreenRefresh: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.ui = new UIRoot(uiRoot);
    this.saveStore = new SaveStore();
    setDigitMode(this.saveStore.current.settings.digits);
    this.renderer = new Renderer(canvas, this.saveStore.current.settings);
    this.physics = null as unknown as PhysicsWorld;
    this.applyUiScale();
    this.lastFrame = performance.now();
    const startAudio = (): void => {
      void this.audio.start().then(() => {
        const s = this.save.settings;
        this.audio.setVolumes(s.masterVolume, s.engineVolume, s.ambienceVolume, s.uiVolume);
      });
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('pointerdown', startAudio);
    window.addEventListener('keydown', startAudio);
    this.ui.root.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement | null;
      if (target && target.closest('button')) this.audio.ui('click');
    });
    const persist = (): void => this.saveStore.flush();
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persist();
    });
  }

  get save() {
    return this.saveStore.current;
  }

  get profiles(): readonly VehicleProfile[] {
    return VEHICLE_PROFILES;
  }

  get selectedProfile(): VehicleProfile {
    return getProfile(this.save.player.selectedVehicleId);
  }

  vehicleState(id: string): VehicleState {
    return this.save.vehicles[id] ?? {
      paintId: 'stock',
      rimId: 'stock',
      tireSet: 'standard',
      fuel: 40,
      tireWear: [0, 0, 0, 0],
      engineWear: 0,
      bodyDamage: 0,
      odometerKm: 0,
      sinceServiceKm: 0,
    };
  }

  async boot(onStatus: (text: string, fraction: number) => void): Promise<void> {
    onStatus('راه‌اندازی موتور فیزیک', 0.25);
    this.physics = await PhysicsWorld.create();
    onStatus('ساخت گاراژ', 0.6);
    this.studio = new StudioScene(this.renderer.engine);
    this.renderer.setScene(this.studio.scene);
    this.renderer.start(() => this.frame());
    await this.studio.setVehicle(this.selectedProfile, this.paintOf(this.selectedProfile), this.rimOf(this.selectedProfile));
    onStatus('آماده', 1);
    this.goMenu();
    this.tryDetectNative();
  }

  private async tryDetectNative(): Promise<void> {
    try {
      const cap = await import('@capacitor/core');
      this.isNative = cap.Capacitor.isNativePlatform();
    } catch {
      this.isNative = false;
    }
  }

  // ---------------------------------------------------------------- screens
  goMenu(): void {
    this.exitDriveToMenu();
    this.ui.mountScreen(menuScreen(this));
  }

  goGarage(): void {
    this.ensureStudio();
    void this.studio?.setVehicle(this.selectedProfile, this.paintOf(this.selectedProfile), this.rimOf(this.selectedProfile));
    this.ui.mountScreen(garageScreen(this));
  }

  goMissions(): void {
    this.ensureStudio();
    this.ui.mountScreen(missionsScreen(this));
  }

  goSettings(): void {
    this.ui.mountScreen(settingsScreen(this));
  }

  goHelp(): void {
    this.ui.mountScreen(helpScreen(this));
  }

  private ensureStudio(): void {
    if (!this.studio) {
      this.studio = new StudioScene(this.renderer.engine);
      this.renderer.setScene(this.studio.scene);
      void this.studio.setVehicle(this.selectedProfile, this.paintOf(this.selectedProfile), this.rimOf(this.selectedProfile));
    }
  }

  // ------------------------------------------------------------- vehicle ops
  selectVehicle(id: string): void {
    if (!this.save.player.unlockedVehicleIds.includes(id)) return;
    this.saveStore.mutate((d) => {
      d.player.selectedVehicleId = id;
    });
    void this.studio?.setVehicle(getProfile(id), this.paintOf(getProfile(id)), this.rimOf(getProfile(id)));
    this.refreshScreen();
  }

  private paintOf(profile: VehicleProfile): string {
    const state = this.vehicleState(profile.id);
    return profile.visual.paints.find((p) => p.id === state.paintId)?.hex ?? (profile.visual.paints[0] as { hex: string }).hex;
  }

  private rimOf(profile: VehicleProfile): string {
    const state = this.vehicleState(profile.id);
    return profile.visual.rims.find((r) => r.id === state.rimId)?.hex ?? (profile.visual.rims[0] as { hex: string }).hex;
  }

  setPaint(paintId: string): void {
    const profile = this.selectedProfile;
    this.saveStore.mutate((d) => {
      const state = d.vehicles[profile.id];
      if (state) state.paintId = paintId;
      d.player.credits = Math.max(0, d.player.credits - 400_000);
    });
    const hex = profile.visual.paints.find((p) => p.id === paintId)?.hex;
    if (hex) this.studio?.setPaint(hex);
    this.ui.toast(FA.toasts.paintChanged);
    this.refreshScreen();
  }

  setRim(rimId: string): void {
    const profile = this.selectedProfile;
    this.saveStore.mutate((d) => {
      const state = d.vehicles[profile.id];
      if (state) state.rimId = rimId;
      d.player.credits = Math.max(0, d.player.credits - 900_000);
    });
    const hex = profile.visual.rims.find((r) => r.id === rimId)?.hex;
    if (hex) this.studio?.setRimColor(hex);
    this.ui.toast(FA.toasts.rimsChanged);
    this.refreshScreen();
  }

  serviceVehicle(kind: 'refuel' | 'repair' | 'full'): void {
    const profile = this.selectedProfile;
    const state = this.vehicleState(profile.id);
    let cost = 0;
    if (kind === 'refuel') cost = Math.round((profile.fuel.tankLitres - state.fuel) * GAME.fuelPricePerLitre);
    if (kind === 'repair') cost = Math.round(state.bodyDamage * 100 * GAME.repairCostPerPercent);
    if (kind === 'full') cost = GAME.serviceCost;
    if (cost > this.save.player.credits) {
      this.ui.toast(FA.notEnoughCredits);
      return;
    }
    this.saveStore.mutate((d) => {
      const v = d.vehicles[profile.id];
      if (!v) return;
      d.player.credits -= cost;
      if (kind === 'refuel' || kind === 'full') v.fuel = profile.fuel.tankLitres;
      if (kind === 'repair' || kind === 'full') {
        v.bodyDamage = 0;
        v.engineWear = Math.max(0, v.engineWear - 0.35);
        v.tireWear = v.tireWear.map((w) => Math.max(0, w - 0.5)) as [number, number, number, number];
        v.sinceServiceKm = 0;
      }
    });
    this.ui.toast(kind === 'refuel' ? FA.toasts.refueled : kind === 'repair' ? FA.toasts.repaired : FA.toasts.serviced);
    this.refreshScreen();
  }

  applySetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.saveStore.mutate((d) => {
      d.settings[key] = value;
    });
    if (key === 'digits') setDigitMode(value as 'fa' | 'latin');
    if (key === 'uiScale') this.applyUiScale();
    const st = this.save.settings;
    if (key === 'masterVolume' || key === 'engineVolume' || key === 'ambienceVolume' || key === 'uiVolume') {
      this.audio.setVolumes(st.masterVolume, st.engineVolume, st.ambienceVolume, st.uiVolume);
    }
    if (key === 'graphics' || key === 'renderScale') this.renderer.applySettings(this.save.settings);
    this.refreshScreen();
  }

  resetSettings(): void {
    const defaults = createDefaultSave().settings;
    this.saveStore.mutate((d) => {
      d.settings = defaults;
    });
    setDigitMode(defaults.digits);
    this.applyUiScale();
    this.renderer.applySettings(this.save.settings);
    this.goSettings();
  }

  private applyUiScale(): void {
    const height = window.innerHeight;
    const base = clamp(height * 0.0148, 12, 22);
    document.documentElement.style.fontSize = `${base * this.save.settings.uiScale}px`;
  }

  private refreshScreen(): void {
    this.onScreenRefresh?.();
  }

  // ------------------------------------------------------------------- drive
  async startDrive(missionId: string | null): Promise<void> {
    if (this.mode === 'loading') return;
    this.mission = missionId ? getMission(missionId) ?? null : null;
    this.mode = 'loading';
    this.showLoading();
    this.ui.clearScreen();
    this.ui.setHud(null);
    this.disposeStudio();

    // Fresh physics world per session: no stale colliders, no leaked bodies.
    this.physics.dispose();
    this.physics = await PhysicsWorld.create();

    const world = new WorldScene(this.renderer.engine, this.physics, this.save.settings, this.save.settings.graphics);
    this.world = world;
    this.renderer.setScene(world.scene);
    await world.load((fraction, label) => this.updateLoading(fraction, label));

    const profile = this.selectedProfile;
    const state = this.vehicleState(profile.id);
    const spawn = this.resolveSpawn(world, this.mission);
    const y = spawn.y ?? world.groundHeightAt(spawn.x, spawn.z) + profile.wheels.radius * 0.1;

    this.vehicle = new VehicleSim(
      profile,
      this.physics,
      { x: spawn.x, y: y + 0.005, z: spawn.z, yaw: spawn.yaw },
      {
        assists: { ...this.save.settings.assists },
        fuel: state.fuel,
        odometerKm: state.odometerKm,
        tireWear: [...state.tireWear],
        bodyDamage: state.bodyDamage,
        engineWear: state.engineWear,
      },
    );
    this.vehicleView = await world.createVehicleView(profile, this.paintOf(profile), this.rimOf(profile));
    world.setWeather(this.mission?.weather ?? 'dry');

    if (world.data) {
      this.traffic = new TrafficSystem(world.scene, this.physics, world.data);
      await this.traffic.load(this.mission ? 0.4 : 1);
      this.traffic.attachBodies();
    }

    this.hud = new Hud(profile, this.mission);
    this.hud.setTelemetryVisible(this.save.settings.showTelemetry);
    this.ui.setHud(this.hud.root);

    this.controls = new TouchControls({
      manual: profile.transmission.kind === 'manual',
      steeringMode: this.save.settings.steeringMode,
      leftHanded: this.save.settings.leftHanded,
      onAction: (action) => this.onControlAction(action),
    });
    this.ui.root.appendChild(this.controls.root);
    this.keyboard = new KeyboardInput();

    this.missionRunner = this.mission
      ? new MissionManager(this.mission, this.vehicle, { x: spawn.x, z: spawn.z, yaw: spawn.yaw })
      : null;

    this.mode = 'drive';
    this.paused = false;
    this.loop = new FixedStepLoop();
    this.lastFrame = performance.now();
    this.loop.start(this.lastFrame);
    this.hideLoading();
    this.updateMapData(world);

    if (profile.transmission.kind === 'manual' && !this.save.player.seenTutorial.manual && this.save.settings.tutorialHints) {
      this.showTutorial('manual');
    } else if (profile.transmission.kind !== 'manual' && !this.save.player.seenTutorial.automatic && this.save.settings.tutorialHints) {
      this.showTutorial('automatic');
    }
  }

  private resolveSpawn(world: WorldScene, mission: MissionDef | null): { x: number; y?: number; z: number; yaw: number } {
    if (mission) {
      const fromWorld = world.spawnFor(mission.spawnId);
      if (fromWorld) return fromWorld;
      return { x: mission.fallback.x, z: mission.fallback.z, yaw: mission.fallback.yaw };
    }
    const free = world.spawnFor('city-center') ?? world.data?.spawns[0];
    if (free) return free;
    return { x: 0, z: 0, yaw: 0 };
  }

  private updateMapData(world: WorldScene): void {
    if (!this.hud) return;
    const polylines = (world.data?.roads ?? []).map((r) => r.points.map((p) => [p[0], p[2]] as [number, number]));
    this.hud.setMap(polylines, world.data?.size ?? 600);
  }

  private onControlAction(action: ControlAction): void {
    const vehicle = this.vehicle;
    if (!vehicle) return;
    switch (action) {
      case 'shiftUp': {
        const result = vehicle.shift(1);
        if (result === 'needClutch') this.hud?.toast('برای تعویض دنده، کلاچ را بگیر');
        break;
      }
      case 'shiftDown': {
        const result = vehicle.shift(-1);
        if (result === 'needClutch') this.hud?.toast('برای تعویض دنده، کلاچ را بگیر');
        break;
      }
      case 'selector': {
        if (vehicle.isManual) {
          vehicle.selectGear(0);
        } else {
          const next = vehicle.cycleSelector();
          this.hud?.toast(`دنده ${next}`);
        }
        break;
      }
      case 'camera': {
        const mode = this.world?.camera.cycle();
        this.hud?.toast(mode === 'chase' ? 'دوربین تعقیب' : mode === 'close' ? 'دوربین نزدیک' : 'دوربین کابین');
        break;
      }
      case 'pause':
        this.pauseGame();
        break;
      case 'reset': {
        const spawn = this.world ? this.resolveSpawn(this.world, this.mission) : { x: 0, z: 0, yaw: 0 };
        vehicle.setPose(spawn.x, (spawn.y ?? this.world?.groundHeightAt(spawn.x, spawn.z) ?? 0) + 0.3, spawn.z, spawn.yaw);
        this.world?.camera.snap(vehicle);
        break;
      }
      case 'handbrake':
        break;
    }
  }

  private frame(): void {
    const now = performance.now();
    const dt = clamp((now - this.lastFrame) / 1000, 0, 0.1);
    this.lastFrame = now;

    if (this.mode === 'drive' && this.vehicle && !this.paused) {
      this.driveFrame(now, dt);
    } else {
      this.studio?.update(dt);
    }
  }

  private driveFrame(now: number, dt: number): void {
    const world = this.world;
    const vehicle = this.vehicle;
    if (!world || !vehicle) return;

    this.controls?.update(dt);
    this.keyboard?.update(dt);
    this.applyInput();

    const steps = this.loop.advance(now);
    const surface = world.surface;
    for (let i = 0; i < steps; i++) {
      vehicle.step(PHYSICS.dt, surface);
      this.traffic?.step(PHYSICS.dt, { x: vehicle.position.x, z: vehicle.position.z }, Math.abs(vehicle.speedMs));
      this.physics.step();
      this.missionRunner?.update(PHYSICS.dt, vehicle.telemetry);
    }

    this.processKeyboardActions();
    this.audio.update(
      vehicle.telemetry,
      this.selectedProfile.audio.firingHzAt1000,
      vehicle.telemetry.groundSurface,
      this.mission?.weather === 'rain',
      this.paused,
    );
    world.update(vehicle, dt);
    this.hud?.update(vehicle.telemetry, now);
    if (this.hud) {
      this.hud.mapOrigin = { x: vehicle.position.x, z: vehicle.position.z, yaw: vehicle.yaw };
      const left = this.missionRunner?.timeLeft;
      if (left !== null && left !== undefined) {
        this.hud.setObjectiveMeta(`زمان: ${formatNumber(left, 1)} ثانیه`);
      } else if (this.missionRunner) {
        this.hud.setObjectiveMeta(this.missionRunner.objectiveText);
      }
    }

    if (this.missionRunner && this.missionRunner.status !== 'running') {
      this.missionEndTimer += dt;
      if (this.missionEndTimer > 1.1) {
        this.endMission();
      }
    }
  }

  private applyInput(): void {
    const vehicle = this.vehicle;
    if (!vehicle) return;
    const touch = this.controls?.state;
    const keys = this.keyboard?.state;
    const throttle = Math.max(touch?.throttle ?? 0, keys?.throttle ?? 0);
    const brake = Math.max(touch?.brake ?? 0, keys?.brake ?? 0);
    const steer = Math.abs(touch?.steer ?? 0) > Math.abs(keys?.steer ?? 0) ? (touch?.steer ?? 0) : (keys?.steer ?? 0);
    vehicle.input.throttle = throttle;
    vehicle.input.brake = brake;
    vehicle.input.clutch = vehicle.isManual ? Math.max(touch?.clutch ?? 0, keys?.clutch ?? 0) : 0;
    vehicle.input.steer = steer;
    vehicle.input.handbrake = Math.max(touch?.handbrake ?? 0, keys?.handbrake ?? 0);
  }

  private processKeyboardActions(): void {
    const kb = this.keyboard;
    if (!kb || kb.actions.length === 0) return;
    const actions = kb.actions;
    kb.actions = [];
    for (const action of actions) {
      if (action === 'pause') this.pauseGame();
      else if (action === 'camera') this.onControlAction('camera');
      else if (action === 'reset') this.onControlAction('reset');
      else if (action === 'shiftUp') this.onControlAction('shiftUp');
      else if (action === 'shiftDown') this.onControlAction('shiftDown');
      else if (action === 'selector') this.onControlAction('selector');
    }
  }

  private endMission(): void {
    if (!this.missionRunner || !this.mission) return;
    const result = this.missionRunner.result();
    this.persistMission(result);
    this.paused = true;
    this.loop.stop();
    this.ui.openOverlay(resultsOverlay(this, result, this.mission));
  }

  private persistMission(result: MissionResult): void {
    if (!this.mission) return;
    const missionId = this.mission.id;
    this.saveStore.mutate((d) => {
      const record = d.missions[missionId] ?? { completed: false, attempts: 0, bestScore: 0, bestTimeSec: null };
      record.attempts += 1;
      record.bestScore = Math.max(record.bestScore, result.score);
      record.completed = record.completed || result.success;
      if (result.success && (record.bestTimeSec === null || result.elapsedSec < record.bestTimeSec)) {
        record.bestTimeSec = result.elapsedSec;
      }
      d.missions[missionId] = record;
      d.player.credits += result.reward;
      d.player.xp += Math.round(result.score * 2);
    });
  }

  pauseGame(): void {
    if (this.mode !== 'drive' || this.paused) return;
    this.paused = true;
    this.loop.stop();
    this.controls?.setVisible(false);
    this.ui.openOverlay(pauseOverlay(this, this.mission));
  }

  resume(): void {
    if (this.mode !== 'drive') return;
    this.paused = false;
    this.ui.closeOverlay();
    this.controls?.setVisible(true);
    this.loop.resync(performance.now());
    this.loop.start(performance.now());
    this.lastFrame = performance.now();
  }

  restartMission(): void {
    const missionId = this.mission?.id ?? null;
    this.disposeDrive();
    void this.startDrive(missionId);
  }

  exitDrive(): void {
    this.goMenu();
  }

  openSettingsOverlay(): void {
    this.goSettings();
  }

  private exitDriveToMenu(): void {
    if (this.mode === 'drive' || this.mode === 'loading') {
      this.disposeDrive();
      this.mode = 'menu';
      this.ensureStudio();
    }
  }

  private disposeDrive(): void {
    this.paused = false;
    this.loop.stop();
    this.controls?.dispose();
    this.controls = null;
    this.keyboard?.dispose();
    this.keyboard = null;
    this.vehicleView?.dispose();
    this.vehicleView = null;
    this.traffic?.dispose();
    this.traffic = null;
    this.vehicle?.dispose();
    this.vehicle = null;
    this.hud?.dispose();
    this.hud = null;
    this.ui.setHud(null);
    this.world?.dispose();
    this.world = null;
    this.missionRunner = null;
    this.mission = null;
    this.missionEndTimer = 0;
    this.audio.silence();
    this.ui.closeOverlay();
  }

  private disposeStudio(): void {
    if (!this.studio) return;
    this.studio.dispose();
    this.studio = null;
  }

  showTutorial(mode: 'manual' | 'automatic'): void {
    if (this.paused) return;
    this.paused = true;
    this.loop.stop();
    const overlay = tutorialOverlay(this, mode, () => this.resume());
    this.ui.openOverlay(overlay);
  }

  markTutorialSeen(mode: 'manual' | 'automatic'): void {
    this.saveStore.mutate((d) => {
      d.player.seenTutorial[mode] = true;
    });
  }

  requestExit(): void {
    if (!this.isNative) {
      this.ui.openOverlay(
        confirmOverlay(FA.exitTitle, 'برای بستن بازی، مرورگر یا تب را ببند.', FA.close, () => this.ui.closeOverlay(), () => this.ui.closeOverlay()),
      );
      return;
    }
    this.ui.openOverlay(
      confirmOverlay(
        FA.exitTitle,
        FA.exitDesc,
        FA.exitApp,
        () => {
          void import('@capacitor/app').then((mod) => mod.App.exitApp()).catch(() => undefined);
        },
        () => this.ui.closeOverlay(),
      ),
    );
  }

  // ------------------------------------------------------------------ loading
  private showLoading(): void {
    const bar = el('span');
    const label = el('div', { class: 'mute', style: 'font-size:0.78rem', text: FA.loadingWorld });
    const node = el(
      'div',
      { class: 'loading-screen' },
      el(
        'div',
        { class: 'loading-inner' },
        el('div', { class: 'spinner' }),
        el('div', { class: 'boot-title', style: 'font-size:1.6rem', text: FA.appName }),
        el('div', { class: 'boot-bar', style: 'margin-top:0.6rem' }, bar),
        label,
      ),
    );
    this.loadingEl = node;
    this.loadingBar = bar;
    this.loadingLabel = label;
    this.ui.root.appendChild(node);
  }

  private updateLoading(fraction: number, label: string): void {
    if (this.loadingBar) this.loadingBar.style.width = `${Math.round(clamp(fraction, 0, 1) * 100)}%`;
    if (this.loadingLabel) this.loadingLabel.textContent = label;
  }

  private hideLoading(): void {
    if (this.loadingEl) {
      this.loadingEl.remove();
      this.loadingEl = null;
      this.loadingBar = null;
      this.loadingLabel = null;
    }
  }

  toast(message: string): void {
    this.ui.toast(message);
  }

  get cameraRig(): CameraRig | null {
    return this.world?.camera ?? null;
  }

  /** Read-only snapshot for automated QA and the developer overlay. */
  get debugState(): Record<string, unknown> {
    return {
      mode: this.mode,
      paused: this.paused,
      vehicle: this.vehicle?.telemetry ?? null,
      position: this.vehicle?.position ?? null,
      yaw: this.vehicle?.yaw ?? null,
      driveline: this.vehicle?.lastDriveline ?? null,
      body: this.vehicle
        ? {
            y: this.vehicle.position.y,
            mass: this.vehicle.body.mass(),
            sleeping: this.vehicle.body.isSleeping(),
            susp: this.vehicle.telemetry.wheels.map((w) => Number(w.suspLength.toFixed(3))),
            contact: this.vehicle.telemetry.wheels.map((w) => w.contact),
            fz: this.vehicle.telemetry.wheels.map((w) => Math.round(w.normalForce)),
          }
        : null,
      mission: this.mission?.id ?? null,
      missionStatus: this.missionRunner?.status ?? null,
      worldLoaded: Boolean(this.world?.data),
    };
  }
}
