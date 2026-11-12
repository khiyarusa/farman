/** Mission catalogue. Coordinates are resolved against world.json at runtime. */

export type MissionKind = 'parking' | 'hillStart' | 'traffic' | 'braking' | 'wet' | 'time' | 'eco';

export interface MissionDef {
  id: string;
  kind: MissionKind;
  titleFa: string;
  descFa: string;
  objectiveFa: string;
  /** Spawn point id in world.json. */
  spawnId: string;
  /** Mission-specific parameters. */
  parTimeSec?: number;
  distanceM?: number;
  targetSpeedKph?: number;
  weather?: 'dry' | 'rain';
  reward: number;
  /** Fallback pose if the world data cannot be read. */
  fallback: { x: number; z: number; yaw: number };
}

export const MISSIONS: readonly MissionDef[] = [
  {
    id: 'parking',
    kind: 'parking',
    titleFa: 'پارک دقیق',
    descFa: 'بدون برخورد، داخل محدوده پارک کن و کامل توقف کن.',
    objectiveFa: 'داخل محدوده پارک توقف کن',
    spawnId: 'city-parking',
    parTimeSec: 60,
    reward: 7_000_000,
    fallback: { x: 26, z: 96, yaw: Math.PI },
  },
  {
    id: 'hill-start',
    kind: 'hillStart',
    titleFa: 'حرکت در سربالایی',
    descFa: 'از سربالایی بدون عقب‌رفتن حرکت کن. کلاچ و گاز را هماهنگ کن.',
    objectiveFa: '۲۵ متر در سربالایی پیش برو',
    spawnId: 'mountain-hillstart',
    distanceM: 25,
    reward: 6_000_000,
    fallback: { x: -210, z: 240, yaw: Math.PI * 0.75 },
  },
  {
    id: 'traffic',
    kind: 'traffic',
    titleFa: 'رانندگی ایمن در ترافیک',
    descFa: 'فاصله ایمن را حفظ کن، از سرعت مجاز بیشتر نرو و برخورد نکن.',
    objectiveFa: '۶۰ ثانیه بدون برخورد رانندگی کن',
    spawnId: 'city-traffic',
    parTimeSec: 60,
    targetSpeedKph: 50,
    reward: 8_000_000,
    fallback: { x: 0, z: 40, yaw: 0 },
  },
  {
    id: 'braking',
    kind: 'braking',
    titleFa: 'ترمز اضطراری',
    descFa: 'شتاب بگیر و پیش از رسیدن به مانع، کامل توقف کن.',
    objectiveFa: 'در محدوده مشخص توقف کن',
    spawnId: 'highway-braking',
    targetSpeedKph: 80,
    reward: 5_500_000,
    fallback: { x: 120, z: -300, yaw: 0 },
  },
  {
    id: 'wet',
    kind: 'wet',
    titleFa: 'کنترل در جاده خیس',
    descFa: 'در باران، پیچ‌ها را با سرعت مناسب طی کن و از جاده خارج نشو.',
    objectiveFa: 'مسیر خیس را بدون خروج از جاده کامل کن',
    spawnId: 'mountain-wet',
    weather: 'rain',
    parTimeSec: 120,
    reward: 8_500_000,
    fallback: { x: -260, z: 150, yaw: Math.PI * 0.7 },
  },
  {
    id: 'time-trial',
    kind: 'time',
    titleFa: 'مسابقه زمان',
    descFa: 'مسیر مشخص‌شده را در کمترین زمان تمام کن. برخورد جریمه دارد.',
    objectiveFa: 'به خط پایان برس',
    spawnId: 'highway-time',
    parTimeSec: 90,
    reward: 10_000_000,
    fallback: { x: 180, z: -360, yaw: 0 },
  },
  {
    id: 'eco',
    kind: 'eco',
    titleFa: 'رانندگی بهینه',
    descFa: 'با کمترین مصرف سوخت مسیر را طی کن؛ شتاب‌های شدید سوخت را هدر می‌دهد.',
    objectiveFa: 'مسیر را با مصرف کم تمام کن',
    spawnId: 'rural-eco',
    parTimeSec: 180,
    reward: 7_500_000,
    fallback: { x: -80, z: -220, yaw: Math.PI / 2 },
  },
];

export function getMission(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}
