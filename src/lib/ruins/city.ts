export type RGB = [number, number, number];
export type Point = { x: number; y: number };
export type Light = Point & { on: RGB; off: RGB; kind: 'flicker' | 'beacon' };

export const LAYER = { sky: 0, mega: 1, far: 2, mid: 3, ground: 4 } as const;

export type Scene = {
	restored: boolean;
	groundY: number;
	S: number;
	layer: Uint8Array;
	roofs: { x: number; w: number; top: number }[];
	tower: {
		railX: number;
		carMin: number;
		carMax: number;
		chase: Point[];
		slit: { x: number; y0: number; y1: number };
		vents: Point[];
	};
	ring: { cx: number; cy: number; R: number; th: number };
	bridge: { y: number; x1: number };
};

export type CityFrame = {
	width: number;
	height: number;
	data: Uint8ClampedArray<ArrayBuffer>;
	lights: Light[];
	scene: Scene;
};

const hex = (s: string): RGB => [
	parseInt(s.slice(1, 3), 16),
	parseInt(s.slice(3, 5), 16),
	parseInt(s.slice(5, 7), 16)
];

const lerp = (a: RGB, b: RGB, t: number): RGB => [
	Math.round(a[0] + (b[0] - a[0]) * t),
	Math.round(a[1] + (b[1] - a[1]) * t),
	Math.round(a[2] + (b[2] - a[2]) * t)
];

const BAYER = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5]
];
const dither = (x: number, y: number) => (BAYER[y & 3][x & 3] + 0.5) / 16;

// 不消耗 rng 的穩定雜湊，全盛版額外的細節用它決定，構圖才不會跟廢墟版錯開
const hash = (x: number, y: number) => {
	let h = Math.imul(x * 374761393 + y * 668265263, 1274126177);
	h ^= h >>> 13;
	return ((Math.imul(h, 1274126177) ^ (h >>> 16)) >>> 0) / 4294967296;
};

function mulberry32(seed: number) {
	let a = seed | 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const NIGHT = {
	skyTop: hex('#030506'),
	skyMid: hex('#060a0a'),
	skyLow: hex('#0d1714'),
	star: hex('#1c2422'),
	starBright: hex('#2c3633'),
	moon: hex('#5a6e66'),
	moonShade: hex('#2e3c37'),
	moonCrater: hex('#4a5c55'),
	mega: hex('#101b18'),
	pipe: hex('#14211d'),
	slit: hex('#0a1a18'),
	megaDark: hex('#0d1614'),
	megaLine: hex('#0b1311'),
	megaEdge: hex('#16231f'),
	cable: hex('#131f1b'),
	far: hex('#0b1311'),
	mid: hex('#070c0b'),
	window: hex('#040606'),
	rebar: hex('#151d1b'),
	vine: hex('#0c1d13'),
	vineLight: hex('#112818'),
	ground: hex('#040706'),
	rubble: hex('#060a09'),
	rubbleSpeck: hex('#0d1412'),
	grass: hex('#0b1b11'),
	grassLight: hex('#10271a'),
	fog: hex('#1a2b25'),
	fogAmount: 0.14,
	lit: [hex('#25392c'), hex('#3d311a'), hex('#1d3238')] as RGB[],
	beaconOn: hex('#7a1c1c'),
	beaconOff: hex('#2a0d0d'),
	pavement: hex('#040706'),
	lamp: hex('#25392c'),
	neon: [hex('#25392c')] as RGB[]
};

// 全盛時期的黃昏：夕陽從右側打出暖色輪廓光
const DUSK: typeof NIGHT = {
	skyTop: hex('#1b1a3d'),
	skyMid: hex('#7a4466'),
	skyLow: hex('#f39a5c'),
	star: hex('#4a4a78'),
	starBright: hex('#8a88c0'),
	moon: hex('#ffe6b0'),
	moonShade: hex('#ffd690'),
	moonCrater: hex('#fff0cc'),
	mega: hex('#3c3054'),
	pipe: hex('#463a62'),
	slit: hex('#ffd27a'),
	megaDark: hex('#30274a'),
	megaLine: hex('#282040'),
	megaEdge: hex('#c47c68'),
	cable: hex('#30274a'),
	far: hex('#2c2344'),
	mid: hex('#1c1630'),
	window: hex('#141024'),
	rebar: hex('#1c1630'),
	vine: hex('#2d5a3c'),
	vineLight: hex('#3f7a4e'),
	ground: hex('#141020'),
	rubble: hex('#141020'),
	rubbleSpeck: hex('#141020'),
	grass: hex('#22402e'),
	grassLight: hex('#2f5a3c'),
	fog: hex('#e08a6a'),
	fogAmount: 0.16,
	lit: [hex('#ffd27a'), hex('#ffb35c'), hex('#9fe3ff'), hex('#ffe9b0')],
	beaconOn: hex('#ff4d4d'),
	beaconOff: hex('#5a1a1a'),
	pavement: hex('#2a2238'),
	lamp: hex('#ffd27a'),
	neon: [hex('#ff5fa2'), hex('#5fe3ff'), hex('#b28cff')]
};

export function renderCity(W: number, H: number, seed = 20261023, restored = false): CityFrame {
	const C = restored ? DUSK : NIGHT;
	const data = new Uint8ClampedArray(W * H * 4);
	const layerOf = new Uint8Array(W * H);
	let curLayer: number = LAYER.sky;
	const lights: Light[] = [];
	const rng = mulberry32(seed);
	const rand = (a: number, b: number) => a + rng() * (b - a);
	const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));

	const set = (x: number, y: number, c: RGB) => {
		x = Math.round(x);
		y = Math.round(y);
		if (x < 0 || y < 0 || x >= W || y >= H) return;
		const i = (y * W + x) * 4;
		data[i] = c[0];
		data[i + 1] = c[1];
		data[i + 2] = c[2];
		data[i + 3] = 255;
		layerOf[y * W + x] = curLayer;
	};
	// 只屬於廢墟的像素：全盛版照樣消耗 rng，但不畫
	const ruin = restored ? () => {} : set;
	const blend = (x: number, y: number, c: RGB, a: number) => {
		if (x < 0 || y < 0 || x >= W || y >= H) return;
		const i = (y * W + x) * 4;
		data[i] += (c[0] - data[i]) * a;
		data[i + 1] += (c[1] - data[i + 1]) * a;
		data[i + 2] += (c[2] - data[i + 2]) * a;
	};
	const rect = (x: number, y: number, w: number, h: number, c: RGB) => {
		for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++)
			for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) set(xx, yy, c);
	};
	const litColor = (x: number, y: number) => C.lit[Math.floor(hash(x, y * 7) * C.lit.length)];

	const S = Math.min(H, Math.max(110, Math.round(W * 0.6)));
	const groundY = H - Math.max(6, Math.round(S * 0.06));

	const BANDS = 10;
	const bands: RGB[] = [];
	for (let i = 0; i < BANDS; i++) {
		const t = i / (BANDS - 1);
		bands.push(t < 0.55 ? lerp(C.skyTop, C.skyMid, t / 0.55) : lerp(C.skyMid, C.skyLow, (t - 0.55) / 0.45));
	}
	for (let y = 0; y < H; y++) {
		const v = (y / H) * (BANDS - 1);
		const i = Math.floor(v);
		const f = v - i;
		for (let x = 0; x < W; x++) set(x, y, f > dither(x, y) ? bands[Math.min(i + 1, BANDS - 1)] : bands[i]);
	}

	for (let n = Math.round(W * H * 0.002); n > 0; n--) {
		const x = randInt(0, W - 1);
		const y = randInt(0, Math.round(H * 0.5));
		const c = rng() < 0.15 ? C.starBright : C.star;
		if (!restored || y < H * 0.22) set(x, y, c);
	}

	// ── 月亮／夕陽 ──
	{
		const cx = Math.round(W * (W > H ? 0.84 : 0.22));
		const cy = Math.round(Math.min(H - S * 0.88, H * 0.18));
		const r = Math.max(5, Math.round(S * 0.045)) + (restored ? 2 : 0);
		const glow = r * (restored ? 9 : 5);
		for (let y = cy - glow; y <= cy + glow; y++)
			for (let x = cx - glow; x <= cx + glow; x++) {
				if (x < 0 || y < 0 || x >= W || y >= H) continue;
				const d = Math.hypot(x - cx, y - cy);
				if (d <= r) {
					const lit = restored || Math.hypot(x - cx + r * 0.45, y - cy - r * 0.2) > r * 0.95;
					set(x, y, lit ? C.moon : C.moonShade);
				} else if (d <= r + 6 && dither(x, y) < 0.5 * (1 - (d - r) / 6)) {
					blend(x, y, C.moon, 0.55);
				} else if (d <= glow) {
					blend(x, y, C.moon, (restored ? 0.22 : 0.09) * (1 - d / glow) ** 2);
				}
			}
		for (let n = 0; n < 4; n++) set(cx + randInt(-r / 2, r / 2), cy + randInt(-r / 2, r / 2), C.moonCrater);
	}

	// ── 巨構：巨環 ──
	curLayer = LAYER.mega;
	const ring = {
		cx: Math.round(W * 0.2),
		cy: groundY + Math.round(S * 0.12),
		R: Math.round(S * 0.72),
		th: Math.max(4, Math.round(S * 0.03))
	};
	{
		const { cx, cy, R, th } = ring;
		const gapA = 68;
		const gapB = 96;
		for (let y = 0; y < groundY; y++)
			for (let x = Math.max(0, cx - R - 1); x < Math.min(W, cx + R + 1); x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d > R || d < R - th) continue;
				const ang = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
				if (ang < 15 || ang > 165) continue;
				const inGap = ang > gapA && ang < gapB;
				if (inGap && !restored) continue;
				const edge = Math.min(Math.abs(ang - gapA), Math.abs(ang - gapB));
				if (!inGap && edge < 3 && rng() < 0.5 && !restored) continue;
				const rib = Math.round(ang) % 6 === 0;
				set(x, y, d < R - th + 1 ? C.megaLine : rib ? C.megaDark : d > R - 1 ? C.megaEdge : C.mega);
			}
		for (const ang of [gapA, gapB]) {
			const a = (ang * Math.PI) / 180;
			const bx = cx + Math.cos(a) * (R - th / 2);
			const by = cy - Math.sin(a) * (R - th / 2);
			for (let k = 0; k < 3; k++) {
				const len = randInt(4, 14);
				const ox = Math.round(bx) + randInt(-2, 2);
				for (let j = 0; j < len; j++) ruin(ox + (j > len * 0.6 ? 1 : 0), Math.round(by) + j, C.cable);
			}
		}
	}

	// ── 巨構：工業巨塔 ──
	const tx = Math.round(W * (W > H ? 0.64 : 0.68));
	const tw = Math.max(18, Math.round(S * 0.22));
	const platY = Math.round(H - S * 0.68);
	const coreL = tx - Math.round(tw * 0.26);
	const coreR = tx + Math.round(tw * 0.26);
	const tr = Math.max(3, Math.round(tw * 0.13));
	const trussLL = coreL - 1 - tr;
	const trussRR = coreR + 2 + tr;
	const railX = coreR + 1;
	const baseTop = Math.round(groundY - S * 0.16);
	const towerInfo: Scene['tower'] = {
		railX,
		carMin: -6,
		carMax: baseTop - 5,
		chase: [],
		slit: { x: tx, y0: platY + 6, y1: platY + 6 + Math.round(S * 0.14) },
		vents: []
	};
	{
		const biteTop = Math.round(H - S * 0.84);
		const biteBot = Math.round(H - S * 0.75);
		const biteDepth = (y: number) =>
			y < biteTop || y > biteBot
				? 0
				: Math.round(Math.sin(((y - biteTop) / (biteBot - biteTop)) * Math.PI) * (tw * 0.5) + rand(0, 2));
		const truss = (x0: number, y: number, flip: boolean) => {
			for (let i = 0; i < tr; i++) {
				const x = x0 + i;
				const k = flip ? tr - 1 - i : i;
				const onEdge = i === 0 || i === tr - 1;
				const diag = (y + k) % (tr * 2) === 0 || (y - k) % (tr * 2) === 0;
				if (onEdge || diag || y % (tr * 2) === 0) set(x, y, onEdge && !flip ? C.megaDark : C.megaEdge);
			}
		};

		for (let y = 0; y < baseTop; y++) {
			const cut = biteDepth(y);
			const cutX = restored ? trussRR : trussRR - cut;
			for (let x = coreL; x <= coreR; x++) {
				if (x > cutX) continue;
				let c = x < tx - 1 ? C.megaDark : C.mega;
				if (x === cutX) c = C.megaEdge;
				else if (y % 10 === 0) c = C.megaLine;
				set(x, y, c);
			}
			truss(trussLL, y, false);
			if (trussRR - tr + 1 <= cutX) truss(trussRR - tr + 1, y, true);
			set(railX, y, C.megaLine);
			for (const [px, joint] of [
				[trussLL - 2, 9],
				[trussLL - 4, 13]
			] as const) {
				set(px, y, y % joint === 0 ? C.megaEdge : C.pipe);
			}
		}
		for (let n = 0; n < 4; n++) {
			const y = randInt(biteTop + 2, biteBot - 2);
			const from = trussRR - biteDepth(y);
			for (let j = 1; j <= randInt(2, 5); j++) ruin(from + j, y, C.megaDark);
		}

		const ringStep = Math.max(18, Math.round(S * 0.2));
		for (let ry = baseTop - ringStep; ry > -2; ry -= ringStep) {
			if (Math.abs(ry - platY) < 6 || (!restored && ry > biteTop - 3 && ry < biteBot + 3)) continue;
			for (let x = trussLL - 6; x <= trussRR + 1; x++) {
				set(x, ry, C.megaEdge);
				set(x, ry + 1, C.megaDark);
			}
			rect(trussLL - 7, ry - 2, 2, 2, C.megaDark);
			towerInfo.vents.push({ x: trussLL - 6, y: ry - 3 });
		}

		const pl = trussLL - Math.round(tw * 0.9);
		const pr = trussRR + Math.round(tw * 0.5);
		for (let x = pl; x <= pr; x++) {
			const jag = x > pr - 4 ? randInt(1, 3) : 3;
			const thick = restored ? 3 : jag;
			for (let j = 0; j < thick; j++) set(x, platY + j, j === 0 ? C.megaEdge : C.megaDark);
			if (x > pl + 2 && x < pr - 4 && x % 7 === 0) for (let j = 3; j < 6; j++) set(x - (j - 3), platY + j, C.megaDark);
			if (x > pl + 2 && x < pr - (restored ? 2 : 6) && (x - pl) % 3 === 0) towerInfo.chase.push({ x, y: platY });
		}
		for (let k = 0; k < 3; k++) {
			const ox = pr - randInt(0, 4);
			for (let j = 3; j < randInt(5, 16); j++) ruin(ox, platY + j, C.cable);
		}
		const mast = pl + 4;
		for (let j = 1; j <= 9; j++) set(mast, platY - j, C.megaDark);
		for (let x = mast - 12; x <= mast + 3; x++) set(x, platY - 9, C.megaEdge);
		for (let j = 1; j <= 7; j++) set(mast - 11, platY - 9 + j, C.cable);
		set(mast - 12, platY - 1, C.cable);
		set(mast - 10, platY - 1, C.cable);
		lights.push({ x: mast + 3, y: platY - 10, on: C.beaconOn, off: C.beaconOff, kind: 'beacon' });
		set(mast + 3, platY - 10, C.beaconOff);

		for (let y = towerInfo.slit.y0; y <= towerInfo.slit.y1; y++) set(tx, y, C.slit);

		for (let y = baseTop; y < groundY; y++) {
			const t = (y - baseTop) / (groundY - baseTop);
			const half = Math.round(tw * (0.55 + t * 0.3));
			for (let x = tx - half; x <= tx + half; x++) {
				let c = x < tx - half / 3 ? C.megaDark : C.mega;
				if (x === tx + half) c = C.megaEdge;
				else if ((y - baseTop) % 3 === 0 && Math.abs(x - tx) < half - 2) c = C.megaLine;
				set(x, y, c);
			}
		}
		rect(tx - 3, groundY - Math.round(S * 0.07), 7, Math.round(S * 0.07), restored ? C.lit[0] : C.window);
		towerInfo.vents.push({ x: tx - Math.round(tw * 0.5), y: baseTop - 1 });

		for (let n = 0; n < 4; n++) {
			const x = randInt(coreL + 1, coreR - 1);
			const y = randInt(4, baseTop - 10);
			if (biteDepth(y) > 0 || x === tx) continue;
			set(x, y, C.lit[2]);
			if (n < 2) lights.push({ x, y, on: C.lit[2], off: C.mega, kind: 'flicker' });
		}

		// 全盛時期：核心豎井整排窗戶都亮著
		if (restored)
			for (let y = 3; y < baseTop - 2; y += 3)
				for (let x = coreL + 1; x < coreR; x += 2) {
					if (x === tx || y % 10 === 0) continue;
					if (hash(x, y) < 0.55) set(x, y, litColor(x, y));
				}
	}

	// ── 巨構：高架巨橋 ──
	const bridgeY = Math.round(groundY - S * 0.55);
	const bridgeEnd = trussLL - 4;
	{
		const by = bridgeY;
		const end = bridgeEnd;
		const gapL = Math.round(end * 0.42);
		const gapR = Math.round(end * 0.55);
		const sag = (x: number) =>
			!restored && x > gapL - 10 && x <= gapL ? Math.round((x - (gapL - 10)) * 0.5) : 0;
		for (let x = 0; x < end; x++) {
			if (!restored && x > gapL && x < gapR) continue;
			const oy = by + sag(x);
			set(x, oy, C.megaEdge);
			set(x, oy + 1, C.mega);
			set(x, oy + 2, C.megaDark);
			for (let r = 3; r < 8; r++) if ((x + r) % 10 === 0 || (x - r) % 10 === 0) set(x, oy + r, C.megaDark);
			set(x, oy + 8, C.megaDark);
		}
		for (const gx of [gapL, gapR]) {
			for (let k = 0; k < 2; k++) {
				const ox = gx + randInt(-2, 2);
				const len = randInt(6, 18);
				for (let j = 3; j < len; j++) ruin(ox, by + sag(ox) + j, C.cable);
			}
		}
		for (let px = Math.round(end * 0.15); px < end - 6; px += Math.max(30, Math.round(end * 0.28))) {
			if (!restored && px > gapL - 8 && px < gapR + 2) continue;
			rect(px, by + 9, 6, groundY - by - 9, C.megaDark);
			rect(px, by + 9, 1, groundY - by - 9, C.megaLine);
		}
	}

	// ── 建築群 ──
	type LayerOpts = {
		color: RGB;
		minH: number;
		maxH: number;
		minW: number;
		maxW: number;
		minGap: number;
		maxGap: number;
		windows: boolean;
		vines: boolean;
	};
	const roofs: Scene['roofs'] = [];
	const layer = (o: LayerOpts) => {
		let x = -randInt(0, 10);
		while (x < W) {
			const w = randInt(o.minW, o.maxW);
			const h = Math.round(rand(o.minH, o.maxH) * S);
			const top = groundY - h;
			const mode = rng();
			const tops: number[] = [];
			if (mode < 0.35) {
				for (let i = 0; i < w; i++) tops.push(top);
			} else if (mode < 0.7) {
				const from = randInt(Math.round(w * 0.2), Math.round(w * 0.7));
				const slope = rand(0.6, 1.8);
				const dir = rng() < 0.5;
				for (let i = 0; i < w; i++) {
					const k = dir ? i - from : from - i;
					tops.push(top + Math.max(0, Math.round(k * slope)) + randInt(0, 1));
				}
			} else {
				let cut = 0;
				for (let i = 0; i < w; i++) {
					cut = Math.max(0, Math.min(h * 0.35, cut + randInt(-2, 2)));
					tops.push(top + Math.round(cut));
				}
			}
			const roofAt = (i: number) => (restored ? top : tops[i]);

			for (let i = 0; i < w; i++) {
				const t = Math.min(roofAt(i), groundY - 2);
				rect(x + i, t, 1, groundY - t, o.color);
			}

			if (mode < 0.35 && rng() < 0.4) {
				const ax = x + randInt(1, w - 2);
				const ah = randInt(3, 9);
				for (let j = 1; j <= ah; j++) set(ax, top - j, o.color);
			}
			if (mode >= 0.35) {
				for (let n = randInt(1, 3); n > 0; n--) {
					const i = randInt(0, w - 1);
					for (let j = 1; j <= randInt(1, 3); j++) ruin(x + i + (j === 3 ? 1 : 0), tops[i] - j, C.rebar);
				}
			}

			if (o.windows) {
				const sx = rng() < 0.5 ? 2 : 3;
				const sy = rng() < 0.5 ? 3 : 4;
				for (let i = 1; i < w - 1; i += sx)
					for (let y = top + 2; y < groundY - 2; y += sy) {
						if (y < tops[i] + 2) {
							if (restored) set(x + i, y, hash(x + i, y) < 0.5 ? litColor(x + i, y) : C.window);
							continue;
						}
						const r1 = rng();
						if (r1 < 0.03) {
							const c = C.lit[randInt(0, C.lit.length - 1)];
							set(x + i, y, c);
							if (rng() < 0.3) lights.push({ x: x + i, y, on: c, off: C.window, kind: 'flicker' });
						} else {
							const r2 = rng();
							if (restored) set(x + i, y, r2 < 0.5 ? litColor(x + i, y) : C.window);
							else if (r2 < 0.85) set(x + i, y, C.window);
						}
					}
				if (rng() < 0.3 && w > 8) {
					const hx = x + randInt(2, w - 6);
					const hy = randInt(top + 4, groundY - 8);
					const hw = randInt(2, 4);
					for (let yy = hy; yy < hy + randInt(2, 4); yy++)
						for (let xx = hx; xx < hx + hw + randInt(0, 1); xx++) if (yy > tops[xx - x] + 1) ruin(xx, yy, C.window);
				}
				// 全盛時期的直立霓虹招牌
				if (restored && w >= 12 && hash(x, top) < 0.45) {
					const nx = x + (hash(top, x) < 0.5 ? 1 : w - 2);
					const nc = C.neon[Math.floor(hash(x, 3) * C.neon.length)];
					const len = Math.min(8, Math.round(h * 0.4));
					for (let j = 0; j < len; j++) set(nx, top + 3 + j, nc);
					for (let j = -1; j <= len; j++) {
						blend(nx - 1, top + 3 + j, nc, 0.25);
						blend(nx + 1, top + 3 + j, nc, 0.25);
					}
				}
			}

			if (o.vines && rng() < 0.65) {
				for (let n = randInt(2, 5); n > 0; n--) {
					const i = randInt(0, w - 1);
					const len = randInt(3, Math.max(4, Math.round(h * 0.6)));
					for (let j = 0; j < len; j++) {
						if (rng() < 0.12) continue;
						const vy = tops[i] + j;
						ruin(x + i, vy, rng() < 0.3 ? C.vineLight : C.vine);
						if (rng() < 0.25) ruin(x + i + (rng() < 0.5 ? -1 : 1), vy, C.vine);
					}
				}
				// 廢墟的苔蘚，在全盛時期是屋頂花園
				for (let i = 0; i < w; i++) if (rng() < 0.5) set(x + i, restored ? top - 1 : tops[i], C.vine);
			}

			if (o.windows && x >= 0 && x + w <= W) roofs.push({ x, w, top: restored ? top : Math.min(...tops) });
			x += w + randInt(o.minGap, o.maxGap);
		}
	};

	curLayer = LAYER.far;
	layer({ color: C.far, minH: 0.22, maxH: 0.48, minW: 8, maxW: 22, minGap: 0, maxGap: 3, windows: false, vines: false });
	curLayer = LAYER.mid;
	layer({ color: C.mid, minH: 0.12, maxH: 0.36, minW: 10, maxW: 26, minGap: 3, maxGap: 14, windows: true, vines: true });

	// ── 地面 ──
	curLayer = LAYER.ground;
	rect(0, groundY, W, H - groundY, C.ground);
	const surface = new Array<number>(W).fill(groundY);
	for (let n = Math.ceil(W / 22); n > 0; n--) {
		const mx = randInt(0, W);
		const mw = randInt(8, 28);
		const mh = randInt(2, 6);
		for (let i = Math.round(-mw / 2); i <= mw / 2; i++) {
			const hh = Math.round(mh * Math.sqrt(Math.max(0, 1 - ((2 * i) / mw) ** 2)));
			for (let j = 0; j < hh; j++) ruin(mx + i, groundY - j, rng() < 0.1 ? C.rubbleSpeck : C.rubble);
			if (!restored && mx + i >= 0 && mx + i < W) surface[mx + i] = Math.min(surface[mx + i], groundY - hh + 1);
		}
	}
	for (let x = 0; x < W; x++) {
		if (rng() > 0.45) continue;
		for (let j = 1; j <= randInt(1, 3); j++) {
			const c = rng() < 0.4 ? C.grassLight : C.grass;
			if (!restored) set(x, surface[x] - j, c);
		}
	}

	// 全盛時期：人行道、路燈、行道樹
	if (restored) {
		for (let x = 0; x < W; x++) set(x, groundY, C.pavement);
		for (let lx = 8; lx < W; lx += 26) {
			for (let j = 1; j <= 7; j++) set(lx, groundY - j, C.megaDark);
			set(lx + 1, groundY - 7, C.megaDark);
			set(lx + 2, groundY - 7, C.lamp);
			for (let dy = -3; dy <= 5; dy++)
				for (let dx = -3; dx <= 7; dx++) {
					const d = Math.hypot(dx - 2, dy * 1.4);
					if (d > 0.5 && d < 6) blend(lx + dx, groundY - 7 + dy, C.lamp, 0.18 * (1 - d / 6));
				}
			const tx2 = lx + 13;
			for (let j = 1; j <= 3; j++) set(tx2, groundY - j, C.megaDark);
			for (let dy = -3; dy <= 0; dy++)
				for (let dx = -2; dx <= 2; dx++)
					if (Math.abs(dx) + Math.abs(dy + 1.5) < 3) set(tx2 + dx, groundY - 4 + dy, hash(dx, dy) < 0.4 ? C.grassLight : C.grass);
		}
	}

	const visible = lights.filter((l) => {
		const i = (l.y * W + l.x) * 4;
		const c = l.kind === 'beacon' ? l.off : l.on;
		return data[i] === c[0] && data[i + 1] === c[1] && data[i + 2] === c[2];
	});

	// ── 地面霧氣 ──
	const fogTop = Math.round(groundY - S * 0.35);
	const fogAlpha = (y: number) =>
		y < fogTop ? 0 : C.fogAmount * Math.min(1, (y - fogTop) / (groundY - fogTop));
	for (let y = Math.max(0, fogTop); y < H; y++) {
		const a = fogAlpha(y);
		const q = Math.floor(a / 0.035) * 0.035;
		for (let x = 0; x < W; x++) blend(x, y, C.fog, (a - q) / 0.035 > dither(x, y) ? q + 0.035 : q);
	}

	const finalLights = visible.slice(0, 7).map((l) => {
		const a = fogAlpha(l.y);
		return { ...l, on: lerp(l.on, C.fog, a), off: lerp(l.off, C.fog, a) };
	});

	return {
		width: W,
		height: H,
		data,
		lights: finalLights,
		scene: {
			restored,
			groundY,
			S,
			layer: layerOf,
			roofs,
			tower: towerInfo,
			ring,
			bridge: { y: bridgeY, x1: bridgeEnd }
		}
	};
}
