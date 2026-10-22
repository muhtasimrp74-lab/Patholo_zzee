(function() {
	//#region src/legacy/welcome-css.ts
	var WELCOME_CSS = ".zz-welcome{position:fixed;z-index:70;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translate(-50%,-12px);opacity:0;width:min(440px,calc(100vw - 24px));box-sizing:border-box;display:flex;gap:14px;align-items:flex-start;padding:14px 8px 14px 14px;border-radius:18px;background:var(--panel,#FFFDFA);color:var(--text,#2A1627);border:1px solid var(--line,#E8D9E3);box-shadow:0 2px 6px rgba(42,22,39,.06),0 18px 44px rgba(42,22,39,.16);font:400 15px/1.45 var(--body,system-ui,sans-serif);transition:opacity .22s cubic-bezier(.2,.7,.2,1),transform .22s cubic-bezier(.2,.7,.2,1);pointer-events:none;contain:layout paint}.zz-welcome.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}.zz-welcome .zw-i,.zz-wd .zi{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,var(--burgundy,#7A1F36) 9%,transparent);color:var(--burgundy,#7A1F36)}.zw-night .zw-i,.zz-wd .zw-night .zi,.zw-evening .zw-i,.zz-wd .zw-evening .zi{background:color-mix(in srgb,var(--plum2,#6B2D5C) 12%,transparent);color:var(--plum2,#6B2D5C)}.zz-welcome svg,.zz-wd .zi svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.zz-welcome .zw-t{flex:1;min-width:0;padding-top:1px}.zz-welcome b{display:inline;font:400 1.125rem/1.25 var(--disp,Georgia,serif);letter-spacing:-.005em;color:var(--text,#2A1627)}.zz-welcome .zw-plan{display:inline-block;margin-left:8px;padding:1px 9px;border-radius:999px;font:600 .6875rem/1.7 var(--body,system-ui,sans-serif);font-style:normal;letter-spacing:.02em;vertical-align:2px;border:1px solid var(--line2,#DCC6D3);color:var(--muted,#735F70)}.zz-welcome .zw-plan[hidden]{display:none}.zz-welcome .zw-paid{border-color:transparent;background:var(--burgundy,#7A1F36);color:#fff}.zz-welcome span{display:block;margin-top:3px;color:var(--muted,#735F70);font-size:.875rem;line-height:1.45;overflow-wrap:anywhere}.zz-welcome span a{color:var(--text,#2A1627);font-weight:600;text-decoration:underline;text-decoration-color:color-mix(in srgb,currentColor 35%,transparent);text-underline-offset:3px}.zz-welcome button{flex:none;display:grid;place-items:center;width:44px;height:44px;margin:-10px -2px -10px 0;border:0;border-radius:50%;background:transparent;color:var(--muted,#735F70);cursor:pointer}.zz-welcome button:hover{background:color-mix(in srgb,var(--text,#2A1627) 6%,transparent);color:var(--text,#2A1627)}.zz-welcome button:focus-visible,.zz-welcome a:focus-visible,.zz-wd button:focus-visible{outline:2px solid var(--burgundy,#7A1F36);outline-offset:2px}:root[data-theme=dark] .zz-welcome,:root[data-theme=dark] .zz-wd .zc{box-shadow:0 2px 6px rgba(0,0,0,.4),0 18px 44px rgba(0,0,0,.5)}:root[data-theme=dark] .zz-welcome .zw-i,:root[data-theme=dark] .zz-wd .zi{color:var(--rosy,#D98FA8);background:color-mix(in srgb,var(--rosy,#D98FA8) 14%,transparent)}.zz-wd{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:16px;background:rgba(28,18,25,.5);backdrop-filter:blur(2px);opacity:0;transition:opacity .22s cubic-bezier(.2,.7,.2,1)}.zz-wd.on{opacity:1}.zz-wd .zc{width:min(400px,100%);box-sizing:border-box;padding:24px;border-radius:20px;background:var(--panel,#FFFDFA);color:var(--text,#2A1627);border:1px solid var(--line,#E8D9E3);box-shadow:0 2px 6px rgba(42,22,39,.08),0 28px 64px rgba(42,22,39,.24);font:400 1rem/1.5 var(--body,system-ui,sans-serif);transform:translateY(8px) scale(.985);transition:transform .22s cubic-bezier(.2,.7,.2,1)}.zz-wd.on .zc{transform:none}.zz-wd .zi{margin-bottom:12px}.zz-wd h2{margin:0 0 6px;font:400 1.75rem/1.15 var(--disp,Georgia,serif);letter-spacing:-.005em}.zz-wd p{margin:0 0 4px;color:var(--muted,#735F70)}.zz-wd label{display:block;margin:16px 0 6px;font-weight:600;font-size:.9375rem}.zz-wd input{display:block;width:100%;box-sizing:border-box;min-height:48px;padding:0 14px;border-radius:10px;border:1px solid var(--line2,#DCC6D3);background:var(--bg,#F8F3EE);color:var(--text,#2A1627);font:inherit;font-size:1.0625rem}.zz-wd input:focus{outline:none;border-color:var(--burgundy,#7A1F36);box-shadow:0 0 0 3px color-mix(in srgb,var(--burgundy,#7A1F36) 12%,transparent)}.zz-wd button{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin-top:14px;border:0;border-radius:10px;background:var(--burgundy,#7A1F36);color:#fff;font:600 .9375rem/1 var(--body,system-ui,sans-serif);cursor:pointer}@media (prefers-reduced-motion:reduce){.zz-welcome,.zz-wd,.zz-wd .zc{transition:opacity .01s}.zz-welcome{transform:translate(-50%,0)}.zz-wd .zc{transform:none}}.zz-welcome .zw-t span a{display:inline-block;padding:10px 0;margin:-10px 0}.zw-bd{position:fixed;inset:0;z-index:69;background:rgba(28,16,24,.3);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);opacity:0;transition:opacity .25s ease}.zw-bd.on{opacity:1}.zz-welcome.zw-center{top:50%;transform:translate(-50%,-46%) scale(.97)}.zz-welcome.zw-center.on{transform:translate(-50%,-50%) scale(1)}.zz-welcome .zw-ex{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;margin-top:14px}.zz-welcome .zw-ex label{display:flex;flex-direction:column;gap:6px;font:600 .8125rem/1.2 var(--body,system-ui,sans-serif);color:var(--text,#2A1627)}.zz-welcome .zw-ex input{height:40px;box-sizing:border-box;border:1px solid var(--line2,#DCC6D3);border-radius:10px;padding:0 10px;background:var(--panel,#FFFDFA);color:var(--text,#2A1627);font:400 .95rem var(--body,system-ui,sans-serif)}.zz-welcome .zw-ex button{height:40px;padding:0 16px;border:0;border-radius:10px;background:var(--burgundy,#7A1F36);color:#fff;font:600 .875rem var(--body,system-ui,sans-serif);cursor:pointer}.zz-welcome .zw-ex .zw-no{background:none;color:var(--muted,#735F70);padding:0 6px;text-decoration:underline;text-underline-offset:3px}.zz-welcome .zw-ex p{margin:0;font-size:.875rem;color:var(--muted,#735F70)}@media (prefers-reduced-motion:reduce){.zz-welcome.zw-center,.zz-welcome.zw-center.on{transform:translate(-50%,-50%)}.zw-bd{transition:none}}.zz-welcome .zw-ex label{flex:1 1 100%}.zz-welcome .zw-ex input{width:100%}.zz-welcome .zw-ex .zw-no{white-space:nowrap}.zz-welcome .zw-ex button{width:auto;min-width:0;flex:none}.zz-welcome.zw-center{flex-wrap:wrap}.zz-welcome .zw-ex{flex:1 1 100%;display:block;margin:4px 6px 2px 54px}.zz-welcome .zw-ex label{display:block;margin:0 0 8px;font:600 .875rem/1.3 var(--body,system-ui,sans-serif);color:var(--text,#2A1627)}.zz-welcome .zw-exr{display:flex;gap:8px;align-items:stretch}.zz-welcome .zw-exr input{flex:1 1 auto;min-width:0;width:auto;height:44px}.zz-welcome .zw-exr button{height:44px;padding:0 16px;border-radius:12px}.zz-welcome .zw-exr .zw-no{border:1px solid var(--line2,#DCC6D3);background:transparent;color:var(--muted,#735F70);text-decoration:none}.zz-welcome .zw-ex p{margin:0}@media (max-width:480px){.zz-welcome .zw-ex{margin:6px 4px 2px}}";
	//#endregion
	//#region src/legacy/welcome.ts
	var netInfo = () => navigator.connection;
	var K = "zzWelcomeAt";
	var DAY = 864e5;
	var now = Date.now();
	var get = (k) => {
		try {
			return window.zzStore.getItem(k);
		} catch {
			return null;
		}
	};
	var set = (k, v) => {
		try {
			window.zzStore.setItem(k, v);
		} catch {}
	};
	var state = () => {
		try {
			return JSON.parse(get("vivaState") || "{}") || {};
		} catch {
			return {};
		}
	};
	var part = (h = (/* @__PURE__ */ new Date()).getHours()) => h >= 5 && h < 12 ? "morning" : h >= 12 && h < 17 ? "afternoon" : h >= 17 && h < 22 ? "evening" : "night";
	var greet = () => {
		const p = part();
		return p === "night" ? "Studying late" : "Good " + p;
	};
	var nm = () => (get("zzName") || "").trim().slice(0, 40);
	var acct = () => window.zzAccount;
	/** First name only: the name the owner typed, else the account name (but not the generated "User 1234"). */
	var first = () => {
		const a = acct(), u = a && a.signedIn && a.signedIn() && a.user ? a.user() : null, d = u && u.display_name || "";
		return (nm() || (/^User \d{4}$/.test(d) ? "" : d)).trim().split(/\s+/)[0].slice(0, 24);
	};
	var ICON = {
		morning: "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4\"/>",
		afternoon: "<circle cx=\"12\" cy=\"12\" r=\"4.5\"/><path d=\"M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21\"/>",
		evening: "<path d=\"M3 17h18M6.5 17a5.5 5.5 0 0 1 11 0M12 6.5V9M5.2 9.7l1.4 1.4M18.8 9.7l-1.4 1.4\"/>",
		night: "<path d=\"M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z\"/>"
	};
	var TIPS = [
		"Say the answer out loud before you open it; recall beats rereading.",
		"Ten focused minutes a day beats one long cram on the weekend.",
		"Mark a card as learned only when you could explain it to a friend.",
		"Mix chapters in Practice: switching topics makes memory stick.",
		"Revisit your bookmarks the day after you save them."
	];
	var idle = (f, timeout = 4e3) => {
		(window.requestIdleCallback || ((c) => setTimeout(c, 1500)))(f, { timeout });
	};
	var raf2 = (f) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(f);
		});
	};
	function css() {
		if (document.getElementById("zz-w-css")) return;
		const st = document.createElement("style");
		st.id = "zz-w-css";
		st.textContent = WELCOME_CSS;
		document.head.appendChild(st);
	}
	function stats() {
		const s = state();
		return {
			n: s.streak && s.streak.n || 0,
			l: (s.learned || []).length
		};
	}
	/** The last question studied on this device, read from the page itself (title and where it lives). */
	function lastCard() {
		const r = state().recent, id = Array.isArray(r) && typeof r[0] === "string" ? r[0] : "";
		const c = id ? document.getElementById(id) : null, v = c && c.closest(".view"), h = c && c.querySelector("h4");
		return c && v && h ? {
			t: (h.textContent || "").trim(),
			href: "#/" + v.id.slice(2) + "/" + id
		} : null;
	}
	/** One useful line: continue where you left off, else streak or progress, else a first step, else a short tip. */
	function usefulLine(sp) {
		const st = stats(), last = lastCard(), streak = st.n > 1 ? st.n + "-day streak" : "";
		sp.textContent = "";
		if (last) {
			const a = document.createElement("a");
			a.href = last.href;
			a.textContent = last.t.length > 48 ? last.t.slice(0, 46).trimEnd() + "…" : last.t;
			sp.append("Continue: ", a);
			if (streak) sp.append(" · " + streak);
		} else if (streak) sp.textContent = "You’re on a " + streak + ". " + (st.l ? st.l + " questions learned so far." : "Keep it going today.");
		else if (st.l) sp.textContent = st.l + " questions learned so far. One short session builds on that.";
		else {
			const a = document.createElement("a");
			a.href = "#/01";
			a.textContent = "Start with topic 01";
			sp.append(a, " — ten minutes is enough.");
		}
		if (!sp.textContent) sp.textContent = TIPS[(/* @__PURE__ */ new Date()).getDate() % TIPS.length];
	}
	/** Plan badge (free or paid), filled in once the account is known; the banner is an overlay, so nothing shifts. */
	function planBadge(el) {
		const a = acct();
		(window.zzAuthReady || Promise.resolve()).then(() => {
			if (!a || !a.signedIn || !a.signedIn() || !a.me) return null;
			return a.me();
		}).then((m) => {
			if (!m) return;
			const t = m.now || Date.now(), on = (m.entitlements || []).filter((e) => e.expires_at > t).map((e) => e.entitlement);
			el.textContent = on.length >= 3 ? "All access" : on.length ? "Pro: " + on.map((e) => ({
				qna: "Questions",
				mcq: "MCQs",
				textbook: "Textbook"
			})[e] || e).join(" + ") : "Free plan";
			el.className = "zw-plan " + (on.length ? "zw-paid" : "zw-free");
			el.hidden = false;
		}).catch(() => {});
	}
	function banner() {
		css();
		const p = part(), f = first();
		const bd = document.createElement("div");
		bd.className = "zw-bd";
		bd.setAttribute("aria-hidden", "true");
		const d = document.createElement("div");
		d.className = "zz-welcome zw-center zw-" + p;
		d.setAttribute("role", "status");
		d.innerHTML = "<div class=\"zw-i\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\">" + ICON[p] + "</svg></div><div class=\"zw-t\"><b></b><i class=\"zw-plan\" hidden></i><span></span></div><button type=\"button\" class=\"zw-x\" aria-label=\"Dismiss\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6 6 18\"/></svg></button>";
		d.querySelector("b").textContent = greet() + (f ? ", " + f : "");
		usefulLine(d.querySelector("span"));
		planBadge(d.querySelector(".zw-plan"));
		let t;
		const arm = () => {
			clearTimeout(t);
			t = setTimeout(close, 7e3);
		};
		examAsk(d, arm);
		document.body.append(bd, d);
		const away = (e) => {
			if (e && e.target instanceof Node && d.contains(e.target)) return;
			if (d.isConnected && performance.now() - t0 > 600) close();
		};
		const EV = [
			"wheel",
			"touchmove",
			"keydown"
		];
		function close() {
			clearTimeout(t);
			d.classList.remove("on");
			bd.classList.remove("on");
			window.removeEventListener("hashchange", away);
			EV.forEach((e) => window.removeEventListener(e, away));
			setTimeout(() => {
				d.remove();
				bd.remove();
			}, 400);
		}
		d.querySelector(".zw-x").addEventListener("click", close);
		bd.addEventListener("click", close);
		d.addEventListener("pointerenter", () => {
			clearTimeout(t);
		});
		d.addEventListener("pointerleave", arm);
		d.addEventListener("focusin", () => {
			clearTimeout(t);
		});
		d.addEventListener("focusout", arm);
		d.querySelector("span a")?.addEventListener("click", close);
		raf2(() => {
			d.classList.add("on");
			bd.classList.add("on");
		});
		arm();
		const t0 = performance.now();
		window.addEventListener("hashchange", away);
		EV.forEach((e) => window.addEventListener(e, away, { passive: true }));
	}
	/** "When is your exam?" inside the greeting while no exam date is set; "Not now" waits a week. */
	function examAsk(box, arm) {
		const st = typeof S !== "undefined" ? S : void 0;
		if (!st || !st.pref || st.pref.exam) return;
		const later = +(get("zzExamAsk") || 0);
		if (Date.now() < later) return;
		const fm = document.createElement("form");
		fm.className = "zw-ex";
		fm.innerHTML = "<label for=\"zw-exd\">When is your exam?</label><div class=\"zw-exr\"><input id=\"zw-exd\" type=\"date\" required><button type=\"submit\">Save</button><button type=\"button\" class=\"zw-no\">Not now</button></div>";
		fm.addEventListener("submit", (e) => {
			e.preventDefault();
			const v = fm.querySelector("input").value;
			if (!v) return;
			st.pref.exam = v;
			if (typeof save === "function") save();
			fm.replaceChildren(Object.assign(document.createElement("p"), { textContent: "Saved. Your countdown and daily plan now use it." }));
			arm();
		});
		fm.querySelector(".zw-no").addEventListener("click", () => {
			set("zzExamAsk", String(Date.now() + 6048e5));
			fm.remove();
			arm();
		});
		box.appendChild(fm);
	}
	function daily(away) {
		css();
		const st = stats(), o = document.createElement("div");
		o.className = "zz-wd";
		o.setAttribute("role", "dialog");
		o.setAttribute("aria-modal", "true");
		o.setAttribute("aria-labelledby", "zz-wh");
		o.innerHTML = "<div class=\"zc zw-" + part() + "\"><div class=\"zi\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\">" + ICON[part()] + "</svg></div><h2 id=\"zz-wh\"></h2><p></p><label for=\"zz-wn\">What should we call you?</label><input id=\"zz-wn\" type=\"text\" maxlength=\"40\" autocomplete=\"given-name\" placeholder=\"First name\"><button type=\"button\">Start studying</button></div>";
		o.querySelector("h2").textContent = greet() + (first() ? ", " + first() : "");
		o.querySelector("p").textContent = away ? "Welcome back — it’s been a little while. Even ten minutes today counts." : st.n > 1 ? "Welcome back! You’re on a " + st.n + "-day revision streak." : "Welcome to your daily revision. A little every day goes a long way.";
		const inp = o.querySelector("input");
		inp.value = nm();
		document.body.appendChild(o);
		const done = () => {
			const v = inp.value.trim().slice(0, 40);
			if (v) set("zzName", v);
			o.classList.remove("on");
			setTimeout(() => {
				o.remove();
				if (v) banner();
			}, 350);
		};
		o.querySelector("button").onclick = done;
		inp.onkeydown = (e) => {
			if (e.key === "Enter") done();
		};
		o.addEventListener("click", (e) => {
			if (e.target === o) done();
		});
		raf2(() => {
			o.classList.add("on");
		});
	}
	function maybe() {
		const last = get(K);
		if (last === null && get("vivaState") === null) {
			set(K, String(now));
			return;
		}
		if (document.querySelector(".tour,.tut,[data-tour]")) return;
		if (last === null || now - +last >= DAY) {
			daily(last !== null && now - +last > 2 * DAY);
			set(K, String(now));
		} else if (!location.hash || /^#\/?(home)?$/.test(location.hash)) banner();
	}
	window.addEventListener("load", () => {
		setTimeout(maybe, 900);
	});
	window.addEventListener("load", () => {
		idle(() => {
			try {
				const c = netInfo();
				if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return;
			} catch {}
			const gated = (window.ZZ_MANIFEST || {}).gated || [];
			for (let n = 1; n <= 29; n++) {
				const id = "ch" + (n < 10 ? "0" : "") + n;
				if (gated.indexOf("tb-" + id) >= 0) continue;
				const u = "textbook/" + id + ".html";
				idle(() => {
					fetch(u, { cache: "force-cache" }).catch(() => {});
				});
			}
			document.querySelectorAll("img").forEach((im) => {
				if (im.decode) im.decode().catch(() => {});
			});
		});
	});
	{
		const SEL = ".card,.qi,.row,.topic,.nh-ch,.nh-mr";
		let gen = 0;
		const run = () => {
			const g = ++gen;
			if (innerWidth < 700) return;
			try {
				if (netInfo()?.saveData) return;
			} catch {}
			const v = document.querySelector(".view:not([hidden])");
			if (!v) return;
			const list = Array.prototype.slice.call(v.querySelectorAll(SEL)).filter((e) => !e.dataset["zzp"]);
			let i = 0;
			const step = (dl) => {
				if (g !== gen) return;
				while (i < list.length && (dl && dl.timeRemaining ? dl.timeRemaining() > 6 : true)) {
					for (let k = 0; k < 12 && i < list.length; k++, i++) {
						const el = list[i];
						el.style.contentVisibility = "visible";
						el.dataset["zzp"] = "1";
					}
					if (!dl || !dl.timeRemaining) break;
				}
				if (i < list.length) idle(step, 800);
			};
			(window.requestIdleCallback || ((c) => setTimeout(c, 300)))(step, { timeout: 1500 });
		};
		window.addEventListener("load", () => {
			setTimeout(run, 1800);
		});
		window.addEventListener("hashchange", () => {
			setTimeout(run, 900);
		});
	}
	{
		const acc = (S) => {
			const P = S.mcq && S.mcq.p || {};
			let n = 0, k = 0;
			Object.keys(P).forEach((h) => {
				const x = P[h];
				if (x && x.n) {
					n += x.n;
					k += x.k || 0;
				}
			});
			return {
				n,
				a: n ? Math.round(100 * k / n) : 0
			};
		};
		const line = (id, N, S) => {
			const l = (S.learned || []).length, n = S.streak && S.streak.n || 0, m = acc(S);
			if (id === "v-home") return n > 1 ? N + ", you’re on a " + n + "-day streak. Let’s keep it going." : l ? N + ", " + l + " questions learned so far. Let’s add more." : N + ", let’s start your first revision.";
			if (id === "v-menu") return N + ", everything of yours lives here.";
			if (id === "v-mcqs") return m.n ? N + ", your accuracy is " + m.a + "% over " + m.n + " answers. " + (m.a >= 70 ? "Strong work!" : "Every attempt makes it stronger.") : N + ", answer a few MCQs and I’ll track your accuracy.";
			if (id === "v-practice") return N + ", ready to test yourself?";
			if (id === "v-textbook") return N + ", pick up your reading wherever you like.";
			if (id === "v-questions") return N + ", 1,310 questions are ready when you are.";
			if (id === "v-bookmarks") return N + ", these are the questions you wanted to come back to.";
			if (id === "v-favourites") return N + ", your favourites, all in one place.";
			if (id === "v-notes") return N + ", your own words, saved on this device.";
			if (/^v-(c?\d+)$/.test(id)) return N + ", one question at a time — you’ve got this.";
			return "";
		};
		const hiCss = () => {
			if (document.getElementById("zz-hi-css")) return;
			const t = document.createElement("style");
			t.id = "zz-hi-css";
			t.textContent = ".zz-hi{margin:8px 0 0;font:600 .95rem/1.4 var(--body,system-ui,sans-serif);color:var(--burgundy2,#93304A)}";
			document.head.appendChild(t);
		};
		const apply = () => {
			document.querySelectorAll(".zz-hi").forEach((e) => {
				e.remove();
			});
			const N = nm();
			if (!N) return;
			const v = document.querySelector(".view:not([hidden])");
			if (!v) return;
			const t = line(v.id, N, state());
			if (!t) return;
			const a = v.querySelector(".lede") || v.querySelector("h1");
			if (!a) return;
			hiCss();
			const p = document.createElement("p");
			p.className = "zz-hi";
			p.textContent = t;
			a.insertAdjacentElement("afterend", p);
		};
		window.zzPersonalise = apply;
		const later = () => {
			apply();
			setTimeout(apply, 400);
			setTimeout(apply, 1500);
		};
		window.addEventListener("load", later);
		window.addEventListener("hashchange", later);
		document.addEventListener("click", (e) => {
			const t = e.target;
			if (t && t.closest && t.closest(".zz-wd button")) setTimeout(apply, 500);
		}, true);
	}
	//#endregion
})();
