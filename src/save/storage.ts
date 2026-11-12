import { SAVE_BACKUP_KEY, SAVE_KEY, createDefaultSave, validateSave, type SaveData } from './schema';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function detectStorage(): StorageLike {
  try {
    if (typeof localStorage !== 'undefined') {
      const probe = '__farman_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage;
    }
  } catch {
    /* private mode / disabled storage */
  }
  // In-memory fallback so the game still runs (progress just will not persist).
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

export class SaveStore {
  private data: SaveData;
  private readonly storage: StorageLike;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  readonly persistent: boolean;

  constructor() {
    const storage = detectStorage();
    this.storage = storage;
    this.persistent = storage === (typeof localStorage !== 'undefined' ? localStorage : null);
    this.data = this.read();
    // Persist the initial save immediately so settings/progress survive a reload
    // even if the player never changes anything.
    this.dirty = true;
    this.flush();
  }

  get current(): SaveData {
    return this.data;
  }

  private read(): SaveData {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    try {
      const parsed: unknown = JSON.parse(raw);
      return validateSave(parsed);
    } catch {
      // Corrupted save: keep it as a backup for support, start clean.
      try {
        this.storage.setItem(SAVE_BACKUP_KEY, raw);
      } catch {
        /* ignore */
      }
      console.warn('[save] corrupted save data, starting from defaults');
      return createDefaultSave();
    }
  }

  /** Mutate and schedule a debounced write. */
  mutate(fn: (data: SaveData) => void): void {
    fn(this.data);
    this.data.updatedAt = Date.now();
    this.dirty = true;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flush(), 400);
  }

  flush(): void {
    if (!this.dirty) return;
    this.dirty = false;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn('[save] write failed', err);
    }
  }

  reset(): void {
    this.data = createDefaultSave();
    this.dirty = true;
    this.flush();
  }
}
