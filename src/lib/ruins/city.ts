export type RGB = [number, number, number];
export type Point = { x: number; y: number };
export type Light = Point & { on: RGB; off: RGB; kind: 'flicker' | 'beacon' };


export const LAYER = { sky: 0, mega: 1, far: 2, mid: 3, ground: 4 } as const;

export type Scene = {
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

function mulberry32(seed: number) {
	let a = seed | 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}


const C = {
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
	lit: [hex('#25392c'), hex('#3d311a'), hex('#1d3238')] as RGB[],
	beaconOn: hex('#7a1c1c'),
	beaconOff: hex('#2a0d0d')
};

export function renderCity(W: number, H: number, seed = 20261023): CityFrame {
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
	const blend = (x: number, y: number, c: RGB, a: number) => {
		const i = (y * W + x) * 4;
		data[i] += (c[0] - data[i]) * a;
		data[i + 1] += (c[1] - data[i + 1]) * a;
		data[i + 2] += (c[2] - data[i + 2]) * a;
	};
	const rect = (x: number, y: number, w: number, h: number, c: RGB) => {
		for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++)
			for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) set(xx, yy, c);
	};


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
		set(randInt(0, W - 1), randInt(0, Math.round(H * 0.5)), rng() < 0.15 ? C.starBright : C.star);
	}

	// ── 月亮 ──
	{
		const cx = Math.round(W * (W > H ? 0.84 : 0.22));
		const cy = Math.round(Math.min(H - S * 0.88, H * 0.18));
		const r = Math.max(5, Math.round(S * 0.045));
		const glow = r * 5;
		for (let y = cy - glow; y <= cy + glow; y++)
			for (let x = cx - glow; x <= cx + glow; x++) {
				if (x < 0 || y < 0 || x >= W || y >= H) continue;
				const d = Math.hypot(x - cx, y - cy);
				if (d <= r) {
					const lit = Math.hypot(x - cx + r * 0.45, y - cy - r * 0.2) > r * 0.95;
					set(x, y, lit ? C.moon : C.moonShade);
				} else if (d <= r + 6 && dither(x, y) < 0.5 * (1 - (d - r) / 6)) {
					blend(x, y, C.moon, 0.55);
				} else if (d <= glow) {
					// 月暈把附近的天空微微照亮
					blend(x, y, C.moon, 0.09 * (1 - d / glow) ** 2);
				}
			}
		for (let n = 0; n < 4; n++) set(cx + randInt(-r / 2, r / 2), cy + randInt(-r / 2, r / 2), C.moonCrater);
	}

	// ── 巨構：斷裂的巨環 ──
	curLayer = LAYER.mega;
	{
		const cx = Math.round(W * 0.2);
		const cy = groundY + Math.round(S * 0.12);
		const R = Math.round(S * 0.72);
		const th = Math.max(4, Math.round(S * 0.03));
		const gapA = 68;
		const gapB = 96;
		for (let y = 0; y < groundY; y++)
			for (let x = Math.max(0, cx - R - 1); x < Math.min(W, cx + R + 1); x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d > R || d < R - th) continue;
				const ang = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
				if (ang < 15 || ang > 165) continue;
				if (ang > gapA && ang < gapB) continue;
				// 斷口參差不齊
				const edge = Math.min(Math.abs(ang - gapA), Math.abs(ang - gapB));
				if (edge < 3 && rng() < 0.5) continue;
				const rib = Math.round(ang) % 6 === 0;
				set(x, y, d < R - th + 1 ? C.megaLine : rib ? C.megaDark : d > R - 1 ? C.megaEdge : C.mega);
			}
		// 斷口垂下的纜線
		for (const ang of [gapA, gapB]) {
			const a = (ang * Math.PI) / 180;
			const bx = cx + Math.cos(a) * (R - th / 2);
			const by = cy - Math.sin(a) * (R - th / 2);
			for (let k = 0; k < 3; k++) {
				const len = randInt(4, 14);
				const ox = Math.round(bx) + randInt(-2, 2);
				for (let j = 0; j < len; j++) set(ox + (j > len * 0.6 ? 1 : 0), Math.round(by) + j, C.cable);
			}
		}
	}

	// ── 巨構：仍在運轉的工業巨塔 ──
	// 核心豎井＋桁架外骨骼＋管線，升降梯沿著斷裂的軌道不斷往返
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
			const cutX = trussRR - cut;
			for (let x = coreL; x <= coreR; x++) {
				if (x > cutX) continue;
				let c = x < tx - 1 ? C.megaDark : C.mega;
				if (x === cutX) c = C.megaEdge;
				else if (y % 10 === 0) c = C.megaLine;
				set(x, y, c);
			}
			truss(trussLL, y, false);
			if (trussRR - tr + 1 <= cutX) truss(trussRR - tr + 1, y, true);
			// 豎井牆面沒了，軌道卻還懸在那裡
			set(railX, y, C.megaLine);
			// 外掛管線
			for (const [px, joint] of [
				[trussLL - 2, 9],
				[trussLL - 4, 13]
			] as const) {
				set(px, y, y % joint === 0 ? C.megaEdge : C.pipe);
			}
		}
		// 斷口裡外露的鋼樑
		for (let n = 0; n < 4; n++) {
			const y = randInt(biteTop + 2, biteBot - 2);
			const from = trussRR - biteDepth(y);
			for (let j = 1; j <= randInt(2, 5); j++) set(from + j, y, C.megaDark);
		}

		// 維修環：每隔一段加一圈，左端設有排氣口
		const ringStep = Math.max(18, Math.round(S * 0.2));
		for (let ry = baseTop - ringStep; ry > -2; ry -= ringStep) {
			if (Math.abs(ry - platY) < 6 || (ry > biteTop - 3 && ry < biteBot + 3)) continue;
			for (let x = trussLL - 6; x <= trussRR + 1; x++) {
				set(x, ry, C.megaEdge);
				set(x, ry + 1, C.megaDark);
			}
			rect(trussLL - 7, ry - 2, 2, 2, C.megaDark);
			towerInfo.vents.push({ x: trussLL - 6, y: ry - 3 });
		}

		// 主平台：左側吊臂，右側斷裂
		const pl = trussLL - Math.round(tw * 0.9);
		const pr = trussRR + Math.round(tw * 0.5);
		for (let x = pl; x <= pr; x++) {
			const thick = x > pr - 4 ? randInt(1, 3) : 3;
			for (let j = 0; j < thick; j++) set(x, platY + j, j === 0 ? C.megaEdge : C.megaDark);
			if (x > pl + 2 && x < pr - 4 && x % 7 === 0) for (let j = 3; j < 6; j++) set(x - (j - 3), platY + j, C.megaDark);
			if (x > pl + 2 && x < pr - 6 && (x - pl) % 3 === 0) towerInfo.chase.push({ x, y: platY });
		}
		for (let k = 0; k < 3; k++) {
			const ox = pr - randInt(0, 4);
			for (let j = 3; j < randInt(5, 16); j++) set(ox, platY + j, C.cable);
		}
		const mast = pl + 4;
		for (let j = 1; j <= 9; j++) set(mast, platY - j, C.megaDark);
		for (let x = mast - 12; x <= mast + 3; x++) set(x, platY - 9, C.megaEdge);
		for (let j = 1; j <= 7; j++) set(mast - 11, platY - 9 + j, C.cable);
		set(mast - 12, platY - 1, C.cable);
		set(mast - 10, platY - 1, C.cable);
		lights.push({ x: mast + 3, y: platY - 10, on: C.beaconOn, off: C.beaconOff, kind: 'beacon' });
		set(mast + 3, platY - 10, C.beaconOff);

		// 核心的觀察縫，脈動光由動畫層負責
		for (let y = towerInfo.slit.y0; y <= towerInfo.slit.y1; y++) set(tx, y, C.slit);

		// 基座：外擴的進氣結構
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
		rect(tx - 3, groundY - Math.round(S * 0.07), 7, Math.round(S * 0.07), C.window);
		towerInfo.vents.push({ x: tx - Math.round(tw * 0.5), y: baseTop - 1 });

		for (let n = 0; n < 4; n++) {
			const x = randInt(coreL + 1, coreR - 1);
			const y = randInt(4, baseTop - 10);
			if (biteDepth(y) > 0 || x === tx) continue;
			set(x, y, C.lit[2]);
			if (n < 2) lights.push({ x, y, on: C.lit[2], off: C.mega, kind: 'flicker' });
		}
	}

	// ── 巨構：斷裂的高架巨橋 ──
	{
		const by = Math.round(groundY - S * 0.55);
		const end = trussLL - 4;
		const gapL = Math.round(end * 0.42);
		const gapR = Math.round(end * 0.55);
		const sag = (x: number) => (x > gapL - 10 && x <= gapL ? Math.round((x - (gapL - 10)) * 0.5) : 0);
		for (let x = 0; x < end; x++) {
			if (x > gapL && x < gapR) continue;
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
				for (let j = 3; j < len; j++) set(ox, by + sag(ox) + j, C.cable);
			}
		}
		// 橋墩
		for (let px = Math.round(end * 0.15); px < end - 6; px += Math.max(30, Math.round(end * 0.28))) {
			if (px > gapL - 8 && px < gapR + 2) continue;
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
				// 斜向崩塌
				const from = randInt(Math.round(w * 0.2), Math.round(w * 0.7));
				const slope = rand(0.6, 1.8);
				const dir = rng() < 0.5;
				for (let i = 0; i < w; i++) {
					const k = dir ? i - from : from - i;
					tops.push(top + Math.max(0, Math.round(k * slope)) + randInt(0, 1));
				}
			} else {
				// 鋸齒狀殘骸
				let cut = 0;
				for (let i = 0; i < w; i++) {
					cut = Math.max(0, Math.min(h * 0.35, cut + randInt(-2, 2)));
					tops.push(top + Math.round(cut));
				}
			}

			for (let i = 0; i < w; i++) {
				const cx = x + i;
				const t = Math.min(tops[i], groundY - 2);
				rect(cx, t, 1, groundY - t, o.color);
			}

			if (mode < 0.35 && rng() < 0.4) {
				const ax = x + randInt(1, w - 2);
				const ah = randInt(3, 9);
				for (let j = 1; j <= ah; j++) set(ax, top - j, o.color);
			}
			if (mode >= 0.35) {
				for (let n = randInt(1, 3); n > 0; n--) {
					const i = randInt(0, w - 1);
					for (let j = 1; j <= randInt(1, 3); j++) set(x + i + (j === 3 ? 1 : 0), tops[i] - j, C.rebar);
				}
			}

			if (o.windows) {
				const sx = rng() < 0.5 ? 2 : 3;
				const sy = rng() < 0.5 ? 3 : 4;
				for (let i = 1; i < w - 1; i += sx)
					for (let y = top + 2; y < groundY - 2; y += sy) {
						if (y < tops[i] + 2) continue;
						if (rng() < 0.03) {
							const c = C.lit[randInt(0, C.lit.length - 1)];
							set(x + i, y, c);
							if (rng() < 0.3) lights.push({ x: x + i, y, on: c, off: C.window, kind: 'flicker' });
						} else if (rng() < 0.85) {
							set(x + i, y, C.window);
						}
					}
				// 牆面破洞
				if (rng() < 0.3 && w > 8) {
					const hx = x + randInt(2, w - 6);
					const hy = randInt(top + 4, groundY - 8);
					const hw = randInt(2, 4);
					for (let yy = hy; yy < hy + randInt(2, 4); yy++)
						for (let xx = hx; xx < hx + hw + randInt(0, 1); xx++) if (yy > tops[xx - x] + 1) set(xx, yy, C.window);
				}
			}

			if (o.vines && rng() < 0.65) {
				for (let n = randInt(2, 5); n > 0; n--) {
					const i = randInt(0, w - 1);
					const len = randInt(3, Math.max(4, Math.round(h * 0.6)));
					for (let j = 0; j < len; j++) {
						if (rng() < 0.12) continue;
						const vy = tops[i] + j;
						set(x + i, vy, rng() < 0.3 ? C.vineLight : C.vine);
						if (rng() < 0.25) set(x + i + (rng() < 0.5 ? -1 : 1), vy, C.vine);
					}
				}
				for (let i = 0; i < w; i++) if (rng() < 0.5) set(x + i, tops[i], C.vine);
			}

			if (o.windows && x >= 0 && x + w <= W) roofs.push({ x, w, top: Math.min(...tops) });
			x += w + randInt(o.minGap, o.maxGap);
		}
	};

	curLayer = LAYER.far;
	layer({ color: C.far, minH: 0.22, maxH: 0.48, minW: 8, maxW: 22, minGap: 0, maxGap: 3, windows: false, vines: false });
	curLayer = LAYER.mid;
	layer({ color: C.mid, minH: 0.12, maxH: 0.36, minW: 10, maxW: 26, minGap: 3, maxGap: 14, windows: true, vines: true });

	// ── 地面、瓦礫、雜草 ──
	curLayer = LAYER.ground;
	rect(0, groundY, W, H - groundY, C.ground);
	const surface = new Array<number>(W).fill(groundY);
	for (let n = Math.ceil(W / 22); n > 0; n--) {
		const mx = randInt(0, W);
		const mw = randInt(8, 28);
		const mh = randInt(2, 6);
		for (let i = Math.round(-mw / 2); i <= mw / 2; i++) {
			const hh = Math.round(mh * Math.sqrt(Math.max(0, 1 - ((2 * i) / mw) ** 2)));
			for (let j = 0; j < hh; j++) set(mx + i, groundY - j, rng() < 0.1 ? C.rubbleSpeck : C.rubble);
			if (mx + i >= 0 && mx + i < W) surface[mx + i] = Math.min(surface[mx + i], groundY - hh + 1);
		}
	}
	for (let x = 0; x < W; x++) {
		if (rng() > 0.45) continue;
		for (let j = 1; j <= randInt(1, 3); j++) set(x, surface[x] - j, rng() < 0.4 ? C.grassLight : C.grass);
	}

	// 被前景蓋住的光點不要閃
	const visible = lights.filter((l) => {
		const i = (l.y * W + l.x) * 4;
		const c = l.kind === 'beacon' ? l.off : l.on;
		return data[i] === c[0] && data[i + 1] === c[1] && data[i + 2] === c[2];
	});

	// ── 地面霧氣 ──
	const fogTop = Math.round(groundY - S * 0.35);
	const fogAlpha = (y: number) => (y < fogTop ? 0 : 0.14 * Math.min(1, (y - fogTop) / (groundY - fogTop)));
	for (let y = Math.max(0, fogTop); y < H; y++) {
		const a = fogAlpha(y);
		const q = Math.floor(a / 0.035) * 0.035;
		for (let x = 0; x < W; x++) blend(x, y, C.fog, (a - q) / 0.035 > dither(x, y) ? q + 0.035 : q);
	}

	// 閃爍的光點也要套上霧色，熄滅時才不會露出色差
	const finalLights = visible.slice(0, 7).map((l) => {
		const a = fogAlpha(l.y);
		return { ...l, on: lerp(l.on, C.fog, a), off: lerp(l.off, C.fog, a) };
	});

	return {
		width: W,
		height: H,
		data,
		lights: finalLights,
		scene: { groundY, S, layer: layerOf, roofs, tower: towerInfo }
	};
}
