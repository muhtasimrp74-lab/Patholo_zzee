(function() {
	//#region src/storage/backends.ts
	var LocalStorageBackend = class {
		name = "localStorage";
		ls;
		constructor(ls) {
			this.ls = ls;
		}
		async get(k) {
			return this.ls.getItem(k);
		}
		async set(k, v) {
			this.ls.setItem(k, v);
		}
		async remove(k) {
			this.ls.removeItem(k);
		}
		async keys() {
			const o = [];
			for (let i = 0; i < this.ls.length; i++) {
				const k = this.ls.key(i);
				if (k !== null) o.push(k);
			}
			return o;
		}
	};
	//#endregion
	//#region src/storage/codecs.ts
	var isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
	var jsonObject = () => ({
		decode: (raw) => {
			if (raw === null || raw === "") return {
				ok: true,
				value: {}
			};
			try {
				const v = JSON.parse(raw);
				return isObj(v) ? {
					ok: true,
					value: v
				} : { ok: false };
			} catch {
				return { ok: false };
			}
		},
		encode: (v) => JSON.stringify(v)
	});
	var str = (d) => ({
		decode: (raw) => ({
			ok: true,
			value: raw === null ? d : raw
		}),
		encode: (v) => v ?? ""
	});
	function defaultState() {
		return {
			fav: [],
			bm: [],
			notes: {},
			learned: [],
			sr: {},
			streak: {
				n: 0,
				last: ""
			},
			recent: [],
			pref: {}
		};
	}
	var CODECS = {
		vivaState: {
			decode: (raw) => {
				const r = jsonObject().decode(raw);
				return r.ok ? {
					ok: true,
					value: Object.assign(defaultState(), r.value)
				} : { ok: false };
			},
			encode: (v) => JSON.stringify(v)
		},
		vivaStatePrev: str(null),
		vivaStateCorrupt: str(null),
		tbDone: jsonObject(),
		tbPos: jsonObject(),
		tbLast: str(null),
		vivaQuiz: str(""),
		"zz-fs": str(null),
		"zz-flat": str(null),
		zzName: str("")
	};
	var KNOWN_KEYS = Object.keys(CODECS);
	//#endregion
	//#region src/storage/migrations.ts
	var VERSION_KEY = "zzStoreVersion";
	/** v0 = data written by every pre-migration build. v1 only stamps the version: no existing key is reshaped,
	*  so old builds keep reading the same data. Add future steps here (from: 1, to: 2, ...), each idempotent. */
	var MIGRATIONS = [{
		from: 0,
		to: 1,
		async run(b) {
			const raw = await b.get("vivaState");
			if (raw !== null && !CODECS.vivaState.decode(raw).ok && await b.get("vivaStateCorrupt") === null) await b.set("vivaStateCorrupt", raw);
			return [];
		}
	}];
	//#endregion
	//#region src/storage/repository.ts
	var ReadOnlyError = class extends Error {
		constructor() {
			super("Store was written by a newer version of the app; refusing to write.");
		}
	};
	var Repository = class {
		readOnly = false;
		backend;
		constructor(backend) {
			this.backend = backend;
		}
		get isReadOnly() {
			return this.readOnly;
		}
		/** Typed read. Missing key -> default. Unreadable vivaState -> default, and the raw text is kept in vivaStateCorrupt
		*  (never overwritten if already present) so nothing is lost. Reading never writes anything except that safety copy. */
		async get(k) {
			const raw = await this.backend.get(k);
			const r = CODECS[k].decode(raw);
			if (r.ok) return r.value;
			if (k === "vivaState" && raw !== null && await this.backend.get("vivaStateCorrupt") === null && !this.readOnly) await this.backend.set("vivaStateCorrupt", raw);
			const d = CODECS[k].decode(null);
			if (!d.ok) throw new Error("No default for " + k);
			return d.value;
		}
		async getRaw(k) {
			return this.backend.get(k);
		}
		async set(k, v) {
			if (this.readOnly) throw new ReadOnlyError();
			if (v === null) return this.backend.remove(k);
			await this.backend.set(k, CODECS[k].encode(v));
		}
		/** Read-modify-write helper for the common `S.x = ...; save()` pattern. */
		async update(k, f) {
			const n = f(await this.get(k));
			await this.set(k, n);
			return n;
		}
		async remove(k) {
			if (this.readOnly) throw new ReadOnlyError();
			await this.backend.remove(k);
		}
		/** Known keys currently present in the backend. */
		async list() {
			const have = new Set(await this.backend.keys());
			return KNOWN_KEYS.filter((k) => have.has(k));
		}
		/** Apply pending migrations in order. Never deletes or reshapes user keys unless a migration step says so (the v0->v1 step only stamps the version).
		*  A store stamped newer than this build is opened read-only. */
		async migrate() {
			const raw = await this.backend.get(VERSION_KEY);
			const from = raw === null ? 0 : Number.parseInt(raw, 10);
			if (!Number.isFinite(from) || from < 0) throw new Error("Unreadable store version: " + raw);
			if (from > 1) {
				this.readOnly = true;
				return {
					from,
					to: from,
					changedKeys: [],
					readOnly: true
				};
			}
			const changed = /* @__PURE__ */ new Set();
			let v = from;
			for (const m of MIGRATIONS) if (m.from === v) {
				for (const k of await m.run(this.backend)) changed.add(k);
				v = m.to;
				await this.backend.set(VERSION_KEY, String(v));
			}
			return {
				from,
				to: v,
				changedKeys: [...changed],
				readOnly: false
			};
		}
		/** Whole-store export of known keys as raw strings (lossless). */
		async exportAll() {
			const keys = {};
			for (const k of await this.list()) {
				const r = await this.backend.get(k);
				if (r !== null) keys[k] = r;
			}
			return {
				format: "zz-store",
				version: 1,
				keys
			};
		}
		/** Validate first, snapshot vivaState into vivaStatePrev, write, and roll every touched key back if any write fails. */
		async importAll(e, mode = "merge") {
			if (this.readOnly) throw new ReadOnlyError();
			if (!e || e.format !== "zz-store" || typeof e.version !== "number" || e.version > 1 || !e.keys || typeof e.keys !== "object") throw new Error("Not a valid store export.");
			for (const [k, v] of Object.entries(e.keys)) {
				if (!KNOWN_KEYS.includes(k) || typeof v !== "string") throw new Error("Unknown or invalid key in export: " + k);
				if (!CODECS[k].decode(v).ok) throw new Error("Unreadable value for " + k);
			}
			const touched = mode === "replace" ? KNOWN_KEYS.slice() : Object.keys(e.keys);
			const before = /* @__PURE__ */ new Map();
			for (const k of [...touched, "vivaStatePrev"]) before.set(k, await this.backend.get(k));
			try {
				const prev = before.get("vivaState");
				if (prev !== null && prev !== void 0) await this.backend.set("vivaStatePrev", prev);
				for (const k of touched) {
					if (k === "vivaStatePrev") continue;
					if (k in e.keys) await this.backend.set(k, e.keys[k]);
					else await this.backend.remove(k);
				}
			} catch (err) {
				for (const [k, v] of before) if (v === null) await this.backend.remove(k).catch(() => {});
				else await this.backend.set(k, v).catch(() => {});
				throw err;
			}
		}
	};
	//#endregion
	//#region src/storage/sync-store.ts
	/** Synchronous facade for screens that must read state at boot and save immediately (the legacy app does `S=JSON.parse(...)` and `save()`).
	*  It has the same getItem/setItem/removeItem contract as localStorage and stores exactly the same bytes, so existing data and old builds are unaffected.
	*  - setItem/removeItem throw like localStorage on quota/blocked storage (callers keep their existing try/catch + alert).
	*  - A store stamped by a newer app version is read-only here too (writes throw ReadOnlyError).
	*  - `subscribe` is the extension point for sync/accounts: a remote or IndexedDB mirror hears every write without screens changing.
	*  - `repository` is the async typed view over the same storage (export/import/migrate/typed get). */
	var LocalStateStore = class {
		repository;
		ls;
		listeners = /* @__PURE__ */ new Set();
		constructor(ls) {
			this.ls = ls;
			this.repository = new Repository(new LocalStorageBackend(ls));
		}
		get isReadOnly() {
			let raw = null;
			try {
				raw = this.ls.getItem(VERSION_KEY);
			} catch {
				return false;
			}
			const v = raw === null ? 0 : Number.parseInt(raw, 10);
			return Number.isFinite(v) && v > 1;
		}
		getItem(k) {
			return this.ls.getItem(k);
		}
		setItem(k, v) {
			if (this.isReadOnly) throw new ReadOnlyError();
			this.ls.setItem(k, v);
			this.emit(k, v);
		}
		removeItem(k) {
			if (this.isReadOnly) throw new ReadOnlyError();
			this.ls.removeItem(k);
			this.emit(k, null);
		}
		/** Typed synchronous read with legacy defaults. Never writes. */
		read(k) {
			const d = CODECS[k].decode(this.getItem(k));
			if (d.ok) return d.value;
			const def = CODECS[k].decode(null);
			if (!def.ok) throw new Error("No default for " + k);
			return def.value;
		}
		subscribe(l) {
			this.listeners.add(l);
			return () => {
				this.listeners.delete(l);
			};
		}
		emit(k, v) {
			for (const l of this.listeners) try {
				l(k, v);
			} catch {}
		}
	};
	//#endregion
	//#region src/storage/browser.ts
	try {
		const store = new LocalStateStore(window.localStorage);
		window.zzStore = store;
		store.repository.migrate().catch(() => {});
	} catch {}
	//#endregion
})();
