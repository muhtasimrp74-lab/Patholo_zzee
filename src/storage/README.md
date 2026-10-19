# Storage layer (`src/storage/`)

Typed, versioned repository over a raw string key-value backend. Values are stored exactly as the legacy app stored them
(JSON text / plain strings), so any older build and any old backup reads the same bytes.

| Piece | File | Notes |
|---|---|---|
| `KVBackend` | `types.ts` | `get/set/remove/keys`, async. Implement this to add a backend. |
| `MemoryBackend`, `LocalStorageBackend`, `IndexedDbBackend` | `backends.ts` | IndexedDB uses its own DB `zz-kv` (never `pathviva-annot`). |
| `Schema`, `CODECS` | `types.ts`, `codecs.ts` | One entry per known key (`vivaState`, `vivaStatePrev`, `vivaStateCorrupt`, `tbDone`, `tbPos`, `tbLast`, `vivaQuiz`, `zz-fs`, `zz-flat`, `zzName`). |
| `Repository` | `repository.ts` | `get/set/update/remove/list/migrate/exportAll/importAll`. |
| `MIGRATIONS` | `migrations.ts` | Version key `zzStoreVersion`. v0 -> v1 only stamps the version; no user key is reshaped. |
| `validateBackup` | `backup.ts` | Port of legacy `vbk()`; same accepted shapes and limits. |

Guarantees (each covered by `src/storage/storage.test.ts`): old data reads unchanged; `migrate()` leaves every stored byte alone;
unknown fields survive read/modify/write; an unreadable `vivaState` is copied to `vivaStateCorrupt` and never overwritten;
a store stamped by a newer app opens read-only; invalid imports change nothing; a failing import write rolls back every touched key.

## Extension points for sync / accounts / encryption (not built)
- **Remote or encrypted backend:** implement `KVBackend`. An encrypting backend wraps another `KVBackend` and transforms values in `get/set`
  (decorator); keys stay plain so `list()` works. Authentication lives in the backend constructor, never in screens.
- **Sync with conflict handling:** run a sync engine beside the repository: read `exportAll()`, compare per-key against the remote, and write
  results back with `set()`. `vivaState` is a good unit for field-level merge (union for `fav/bm/learned`, last-writer-wins per note id, max for `streak`).
  Add a per-key `updatedAt` map under a new key and a v1 -> v2 migration; old builds ignore unknown keys.
- **Student accounts:** namespace keys per account by passing a prefixing `KVBackend` wrapper; screens do not change.
- **Annotations:** still use their own IndexedDB `pathviva-annot` (v1; stores `docs`, `meta`). Moving them behind `Repository` is a later step; do not change that schema without a migration.

## Status
Implemented and tested in isolation (node unit tests; IndexedDB adapter in Chromium). **Legacy screens are not yet routed through it** (see MIGRATION_STATUS.md).
