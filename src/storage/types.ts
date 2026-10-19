/** Raw string key-value backend. Values are stored exactly as the legacy app stored them (JSON text or plain strings),
 *  so data written by any older build reads back unchanged. Backends are async so IndexedDB (and later remote) fit. */
export interface KVBackend {
  readonly name: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export interface Streak { n: number; last: string }
/** vivaState: unknown extra fields are preserved on read/write (forward compatibility). */
export interface VivaState {
  fav: string[]; bm: string[]; notes: Record<string, string>; learned: string[];
  sr: Record<string, Record<string, unknown>>; streak: Streak; recent: string[]; pref: Record<string, unknown>;
  mcq?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface Schema {
  vivaState: VivaState;
  vivaStatePrev: string | null;       // raw text of the state kept before a restore
  vivaStateCorrupt: string | null;    // raw text of an unreadable state, kept instead of overwritten
  tbDone: Record<string, unknown>;    // {chapterId: 1}
  tbPos: Record<string, unknown>;     // {chapterId: scrollFraction}
  tbLast: string | null;
  vivaQuiz: string;                   // '1' | ''
  'zz-fs': string | null;
  'zz-flat': string | null;
  zzName: string;
}
export type Key = keyof Schema;

export interface StoreExport { format: 'zz-store'; version: number; keys: Record<string, string> }
export interface MigrationReport { from: number; to: number; changedKeys: string[]; readOnly: boolean }
