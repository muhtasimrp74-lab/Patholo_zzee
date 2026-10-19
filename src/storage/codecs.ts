import type { Schema, Key, VivaState } from './types.ts';

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

export interface Codec<T> { decode(raw: string | null): { ok: true; value: T } | { ok: false }; encode(v: T): string }

const jsonObject = (): Codec<Record<string, unknown>> => ({
  decode: raw => { if (raw === null || raw === '') return { ok: true, value: {} }; try { const v = JSON.parse(raw); return isObj(v) ? { ok: true, value: v } : { ok: false }; } catch { return { ok: false }; } },
  encode: v => JSON.stringify(v),
});
const str = <D extends string | null>(d: D): Codec<string | D> => ({ decode: raw => ({ ok: true, value: raw === null ? d : raw }), encode: v => v ?? '' });

export function defaultState(): VivaState { return { fav: [], bm: [], notes: {}, learned: [], sr: {}, streak: { n: 0, last: '' }, recent: [], pref: {} }; }

/** Legacy semantics: Object.assign(defaults, parsed). Unknown fields are kept. */
const viva: Codec<VivaState> = {
  decode: raw => { const r = jsonObject().decode(raw); return r.ok ? { ok: true, value: Object.assign(defaultState(), r.value) as VivaState } : { ok: false }; },
  encode: v => JSON.stringify(v),
};

export const CODECS: { [K in Key]: Codec<Schema[K]> } = {
  vivaState: viva,
  vivaStatePrev: str(null) as Codec<string | null>,
  vivaStateCorrupt: str(null) as Codec<string | null>,
  tbDone: jsonObject(), tbPos: jsonObject(),
  tbLast: str(null) as Codec<string | null>,
  vivaQuiz: str('') as Codec<string>,
  'zz-fs': str(null) as Codec<string | null>, 'zz-flat': str(null) as Codec<string | null>,
  zzName: str('') as Codec<string>,
};
export const KNOWN_KEYS = Object.keys(CODECS) as Key[];
