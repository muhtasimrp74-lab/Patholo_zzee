/** Port of the legacy `vbk()` backup validator (tools/src/index.base.html). Same accepted shapes and limits; returns the
 *  sanitised vivaState subset or null. Backups also carry `annot` (and legacy `ink`); those are validated by the annotation module. */
const ob = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const ar = (x: unknown): x is unknown[] => Array.isArray(x);
const ids = (x: unknown): x is string[] => ar(x) && x.length <= 20000 && x.every(i => typeof i === 'string' && i.length <= 40);

export function validateBackup(o: unknown): Record<string, unknown> | null {
  if (!ob(o) || !ids(o['bm'])) return null;
  const r: Record<string, unknown> = { bm: o['bm'] };
  for (const k of ['fav', 'learned']) if (k in o) { if (!ids(o[k])) return null; r[k] = o[k]; }
  if ('notes' in o) { const n = o['notes']; if (!ob(n) || !Object.values(n).every(v => typeof v === 'string' && v.length < 50000)) return null; r['notes'] = n; }
  for (const k of ['sr', 'pref']) if (k in o) { if (!ob(o[k])) return null; r[k] = o[k]; }
  if ('streak' in o) { const s = o['streak']; if (!ob(s) || typeof s['n'] !== 'number' || typeof s['last'] !== 'string') return null; r['streak'] = s; }
  if ('recent' in o) { if (!ar(o['recent'])) return null; r['recent'] = o['recent']; }
  if ('mcq' in o) {
    const m = o['mcq']; if (!ob(m)) return null;
    for (const k of ['p', 'o', 'rd', 'nt', 'day']) if (k in m && !ob(m[k])) return null;
    for (const k of ['bm', 'hist', 'rv', 'ms']) if (k in m && !ar(m[k])) return null;
    r['mcq'] = m;
  }
  return r;
}
