import type { KVBackend } from './types.ts';
import { KNOWN_KEYS, CODECS } from './codecs.ts';

export const VERSION_KEY = 'zzStoreVersion';
export const CURRENT_VERSION = 1;

export interface Migration { from: number; to: number; run(b: KVBackend): Promise<string[]> } // returns user keys it changed

/** v0 = data written by every pre-migration build. v1 only stamps the version: no existing key is reshaped,
 *  so old builds keep reading the same data. Add future steps here (from: 1, to: 2, ...), each idempotent. */
export const MIGRATIONS: Migration[] = [
  { from: 0, to: 1, async run(b) {
      // Safety: an unreadable vivaState is preserved (copy) before anything else could ever touch it.
      const raw = await b.get('vivaState');
      if (raw !== null && !CODECS.vivaState.decode(raw).ok && (await b.get('vivaStateCorrupt')) === null) await b.set('vivaStateCorrupt', raw);
      void KNOWN_KEYS; return [];
  } },
];
