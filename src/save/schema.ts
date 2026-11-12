/** Save-file schema, defaults and validation. Schema version 1 is the initial V1 format. */

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'farman.save.v1';
export const SAVE_BACKUP_KEY = 'farman.save.backup';

export type GraphicsProfile = 'low' | 'balanced' | 'high';
export type SteeringMode = 'wheel' | 'buttons' | 'gyro';
export type TireSet = 'standard' | 'sport' | 'allseason';

export interface AssistSettings {
  abs: boolean;
  tcs: boolean;
  esc: boolean;
  autoClutch: boolean;
  /** 0 = raw physics, 1 = maximum stabilising help. */
  stability: number;
}

export interface Settings {
  graphics: GraphicsProfile;
  renderScale: number;
  masterVolume: number;
  engineVolume: number;
  ambienceVolume: number;
  uiVolume: number;
  steeringMode: SteeringMode;
  steeringSensitivity: number;
  controlSize: number;
  controlOpacity: number;
  leftHanded: boolean;
  uiScale: number;
  assists: AssistSettings;
  showTelemetry: boolean;
  digits: 'fa' | 'latin';
  tutorialHints: boolean;
}

export interface VehicleState {
  paintId: string;
  rimId: string;
  tireSet: TireSet;
  /** Litres remaining in the tank. */
  fuel: number;
  /** 0 = new, 1 = fully worn, order: FL, FR, RL, RR. */
  tireWear: [number, number, number, number];
  /** 0 = healthy, 1 = failed. */
  engineWear: number;
  /** 0 = pristine, 1 = heavy body damage. */
  bodyDamage: number;
  odometerKm: number;
  /** Kilometres since last service. */
  sinceServiceKm: number;
}

export interface MissionRecord {
  completed: boolean;
  attempts: number;
  bestScore: number;
  bestTimeSec: number | null;
}

export interface PlayerState {
  credits: number;
  xp: number;
  level: number;
  selectedVehicleId: string;
  unlockedVehicleIds: string[];
  totalKm: number;
  seenTutorial: { manual: boolean; automatic: boolean };
}

export interface SaveData {
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  settings: Settings;
  player: PlayerState;
  vehicles: Record<string, VehicleState>;
  missions: Record<string, MissionRecord>;
}

export function defaultVehicleState(tankLitres: number): VehicleState {
  return {
    paintId: 'stock',
    rimId: 'stock',
    tireSet: 'standard',
    fuel: tankLitres * 0.75,
    tireWear: [0, 0, 0, 0],
    engineWear: 0,
    bodyDamage: 0,
    odometerKm: 0,
    sinceServiceKm: 0,
  };
}

export function createDefaultSave(): SaveData {
  const now = Date.now();
  return {
    schemaVersion: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: {
      graphics: 'balanced',
      renderScale: 1,
      masterVolume: 0.8,
      engineVolume: 0.85,
      ambienceVolume: 0.5,
      uiVolume: 0.6,
      steeringMode: 'wheel',
      steeringSensitivity: 1,
      controlSize: 1,
      controlOpacity: 0.85,
      leftHanded: false,
      uiScale: 1,
      assists: { abs: true, tcs: true, esc: true, autoClutch: true, stability: 0.5 },
      showTelemetry: false,
      digits: 'fa',
      tutorialHints: true,
    },
    player: {
      credits: 42_000_000,
      xp: 0,
      level: 1,
      selectedVehicleId: 'pride-131',
      unlockedVehicleIds: ['pride-131', 'corolla-e210', 'bmw-320i'],
      totalKm: 0,
      seenTutorial: { manual: false, automatic: false },
    },
    vehicles: {
      'pride-131': defaultVehicleState(37),
      'corolla-e210': defaultVehicleState(47),
      'bmw-320i': defaultVehicleState(59),
    },
    missions: {},
  };
}

const clampNum = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

const bool = (v: unknown, fallback: boolean): boolean =>
  typeof v === 'boolean' ? v : fallback;

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

/** Validates untrusted (possibly hand-edited) save data and repairs what it can. */
export function validateSave(raw: unknown): SaveData {
  const base = createDefaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<SaveData>;

  const s = (data.settings ?? {}) as Partial<Settings>;
  const assists = (s.assists ?? {}) as Partial<AssistSettings>;
  const p = (data.player ?? {}) as Partial<PlayerState>;

  const settings: Settings = {
    graphics: oneOf(s.graphics, ['low', 'balanced', 'high'] as const, base.settings.graphics),
    renderScale: clampNum(s.renderScale, 0.6, 1.5, base.settings.renderScale),
    masterVolume: clampNum(s.masterVolume, 0, 1, base.settings.masterVolume),
    engineVolume: clampNum(s.engineVolume, 0, 1, base.settings.engineVolume),
    ambienceVolume: clampNum(s.ambienceVolume, 0, 1, base.settings.ambienceVolume),
    uiVolume: clampNum(s.uiVolume, 0, 1, base.settings.uiVolume),
    steeringMode: oneOf(s.steeringMode, ['wheel', 'buttons', 'gyro'] as const, base.settings.steeringMode),
    steeringSensitivity: clampNum(s.steeringSensitivity, 0.4, 1.8, base.settings.steeringSensitivity),
    controlSize: clampNum(s.controlSize, 0.8, 1.3, base.settings.controlSize),
    controlOpacity: clampNum(s.controlOpacity, 0.35, 1, base.settings.controlOpacity),
    leftHanded: bool(s.leftHanded, base.settings.leftHanded),
    uiScale: clampNum(s.uiScale, 0.85, 1.35, base.settings.uiScale),
    assists: {
      abs: bool(assists.abs, base.settings.assists.abs),
      tcs: bool(assists.tcs, base.settings.assists.tcs),
      esc: bool(assists.esc, base.settings.assists.esc),
      autoClutch: bool(assists.autoClutch, base.settings.assists.autoClutch),
      stability: clampNum(assists.stability, 0, 1, base.settings.assists.stability),
    },
    showTelemetry: bool(s.showTelemetry, base.settings.showTelemetry),
    digits: oneOf(s.digits, ['fa', 'latin'] as const, base.settings.digits),
    tutorialHints: bool(s.tutorialHints, base.settings.tutorialHints),
  };

  const unlocked = Array.isArray(p.unlockedVehicleIds)
    ? p.unlockedVehicleIds.filter((id): id is string => typeof id === 'string')
    : base.player.unlockedVehicleIds;

  const player: PlayerState = {
    credits: clampNum(p.credits, 0, 9_999_999_999, base.player.credits),
    xp: clampNum(p.xp, 0, 9_999_999, 0),
    level: clampNum(p.level, 1, 999, 1),
    selectedVehicleId:
      typeof p.selectedVehicleId === 'string' ? p.selectedVehicleId : base.player.selectedVehicleId,
    unlockedVehicleIds: unlocked.length ? unlocked : base.player.unlockedVehicleIds,
    totalKm: clampNum(p.totalKm, 0, 9_999_999, 0),
    seenTutorial: {
      manual: bool((p.seenTutorial ?? {}).manual, false),
      automatic: bool((p.seenTutorial ?? {}).automatic, false),
    },
  };
  if (!player.unlockedVehicleIds.includes(player.selectedVehicleId)) {
    player.unlockedVehicleIds.push(player.selectedVehicleId);
  }

  const vehicles: Record<string, VehicleState> = {};
  if (data.vehicles && typeof data.vehicles === 'object') {
    for (const [id, vRaw] of Object.entries(data.vehicles)) {
      const v = (vRaw ?? {}) as Partial<VehicleState>;
      const wear = Array.isArray(v.tireWear) ? v.tireWear : [0, 0, 0, 0];
      vehicles[id] = {
        paintId: typeof v.paintId === 'string' ? v.paintId : 'stock',
        rimId: typeof v.rimId === 'string' ? v.rimId : 'stock',
        tireSet: oneOf(v.tireSet, ['standard', 'sport', 'allseason'] as const, 'standard'),
        fuel: clampNum(v.fuel, 0, 200, 40),
        tireWear: [
          clampNum(wear[0], 0, 1, 0),
          clampNum(wear[1], 0, 1, 0),
          clampNum(wear[2], 0, 1, 0),
          clampNum(wear[3], 0, 1, 0),
        ],
        engineWear: clampNum(v.engineWear, 0, 1, 0),
        bodyDamage: clampNum(v.bodyDamage, 0, 1, 0),
        odometerKm: clampNum(v.odometerKm, 0, 9_999_999, 0),
        sinceServiceKm: clampNum(v.sinceServiceKm, 0, 9_999_999, 0),
      };
    }
  }
  for (const id of Object.keys(base.vehicles)) {
    if (!vehicles[id]) vehicles[id] = base.vehicles[id] as VehicleState;
  }

  const missions: Record<string, MissionRecord> = {};
  if (data.missions && typeof data.missions === 'object') {
    for (const [id, mRaw] of Object.entries(data.missions)) {
      const m = (mRaw ?? {}) as Partial<MissionRecord>;
      missions[id] = {
        completed: bool(m.completed, false),
        attempts: clampNum(m.attempts, 0, 9999, 0),
        bestScore: clampNum(m.bestScore, 0, 100, 0),
        bestTimeSec:
          typeof m.bestTimeSec === 'number' && Number.isFinite(m.bestTimeSec) ? m.bestTimeSec : null,
      };
    }
  }

  return {
    schemaVersion: SAVE_VERSION,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : base.createdAt,
    updatedAt: Date.now(),
    settings,
    player,
    vehicles,
    missions,
  };
}
