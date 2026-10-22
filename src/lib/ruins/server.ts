import type { RGB } from './city';

const hex = (s: string): RGB => [
	parseInt(s.slice(1, 3), 16),
	parseInt(s.slice(3, 5), 16),
	parseInt(s.slice(5, 7), 16)
];

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
	metal: hex('#1c2624'),
	metalLight: hex('#2c3a36'),
	metalDark: hex('#101715'),
	edge: hex('#3d4e48'),
	rust: hex('#3e2618'),
	rustLight: hex('#5e3920'),
	vent: hex('#080c0b'),
	slot: hex('#040706'),
	copper: hex('#7a5530'),
	ledGreen: hex('#39ff88'),
	ledGreenOff: hex('#0f2a1c'),
	ledAmber: hex('#ffb030'),
	ledAmberOff: hex('#2a1e0a'),
	ledRed: hex('#ff3838'),
	ledRedOff: hex('#2a0a0a'),
	casing: hex('#262f2c'),
	casingLight: hex('#38443f'),
	screen: hex('#06120d'),
	glow: hex('#2aff9a'),
	glowDim: hex('#0f4a30'),
	cable: hex('#141b19'),
	cableRust: hex('#2a1a12'),
	soil: hex('#070b0a'),
	soilLight: hex('#111815'),
	concrete: hex('#1a211f'),
	concreteLight: hex('#262e2b'),
	key: hex('#2e3835'),
	grass: [hex('#0d2414'), hex('#14381e'), hex('#1d4f2a'), hex('#286436')] as RGB[],
	vine: hex('#16402a'),
	leaf: hex('#21603a'),
	flower: [hex('#b8c890'), hex('#c890a8'), hex('#90b0c8')] as RGB[],
	firefly: hex('#d8ff70'),
	batteryLabel: hex('#c8a040'),
	batteryDead: hex('#5a1a1a'),
	panel: hex('#142236'),
	panelGrid: hex('#24364c'),
	panelCrack: hex('#4a5c74'),
	panelGlint: hex('#8ab0d8')
};

type Rect = { x: number; y: number; w: number; h: number };

export type ServerState = {
	station: 'empty' | 'charging' | 'full';
	progress: number;
	installed: boolean;
	bootT: number;
	updateReady: boolean;
};

export type ServerFrame = {
	data: Uint8ClampedArray<ArrayBuffer>;
	slot: Rect;
	station: Rect;
	crt: Rect;
};

const IDLE: ServerState = {
	station: 'empty',
	progress: 0,
	installed: false,
	bootT: 0,
	updateReady: false
};

export function renderServer(
	W: number,
	H: number,
	t: number,
	state = IDLE,
	seed = 1023
): ServerFrame {
	const data = new Uint8ClampedArray(W * H * 4);
	const rng = mulberry32(seed);
	const rand = (a: number, b: number) => a + rng() * (b - a);
	const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));

	const set = (x: number, y: number, c: RGB, a = 1) => {
		x = Math.round(x);
		y = Math.round(y);
		if (x < 0 || y < 0 || x >= W || y >= H) return;
		const i = (y * W + x) * 4;
		const da = data[i + 3] / 255;
		if (a >= 1 || da === 0) {
			data[i] = c[0];
			data[i + 1] = c[1];
			data[i + 2] = c[2];
			data[i + 3] = Math.max(data[i + 3], a * 255);
			return;
		}
		data[i] += (c[0] - data[i]) * a;
		data[i + 1] += (c[1] - data[i + 1]) * a;
		data[i + 2] += (c[2] - data[i + 2]) * a;
	};
	const rect = (x: number, y: number, w: number, h: number, c: RGB) => {
		for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, c);
	};
	const blink = (period: number, duty: number, offset = 0) =>
		((t + offset) % period) / period < duty;

	const battery = (x: number, y: number, charge: number) => {
		for (let j = 0; j < 6; j++)
			for (let i = 0; i < 15; i++) {
				const edge = j === 0 || j === 5 || i === 0 || i === 14;
				set(x + i, y + j, edge ? C.casingLight : i <= 3 ? C.batteryLabel : C.metalDark);
			}
		set(x + 15, y + 2, C.copper);
		set(x + 15, y + 3, C.copper);
		const bars = Math.ceil(charge * 3 - 0.001);
		for (let b = 0; b < 3; b++) {
			const c =
				charge >= 1
					? C.ledGreen
					: b < bars
						? C.ledAmber
						: b === 0
							? C.batteryDead
							: C.metal;
			rect(x + 5 + b * 3, y + 2, 2, 2, c);
		}
	};
	const { installed, bootT } = state;
	const booted = installed && bootT > 2.6;

	const groundY = H - 12;
	const cx = Math.round(W / 2);
	const rw = 44;
	const rh = 54;
	const rx = cx - rw / 2;
	const ry = groundY - rh + 2;

	// ── 地面 ──
	const surface: number[] = [];
	for (let x = 0; x < W; x++) {
		const y = groundY + Math.round(Math.sin(x * 0.11) * 0.8 + Math.sin(x * 0.037 + 1) * 1.2);
		surface.push(y);
		for (let yy = y; yy < H; yy++) set(x, yy, rng() < 0.08 ? C.soilLight : C.soil);
	}
	// 水泥碎塊
	for (let n = Math.ceil(W / 40); n > 0; n--) {
		const bx = randInt(0, W);
		if (Math.abs(bx - cx) < rw / 2 + 4) continue;
		const bw = randInt(3, 8);
		const bh = randInt(2, 4);
		for (let i = 0; i < bw; i++)
			for (let j = 0; j < bh - (i === 0 || i === bw - 1 ? 1 : 0); j++)
				set(
					bx + i,
					surface[Math.min(W - 1, Math.max(0, bx))] - j,
					j === bh - 1 ? C.concreteLight : C.concrete
				);
	}

	// ── 後方的纜線，垂到地面再沒入草叢 ──
	const cables: [number, number, RGB][] = [
		[rx + 6, -1, C.cable],
		[rx + rw - 6, 1, C.cableRust],
		[rx + rw - 10, 1, C.cable]
	];
	for (const [sx, dir, color] of cables) {
		const len = randInt(30, 60);
		const sy = ry + randInt(8, 20);
		let prev = sy;
		for (let i = 0; i <= len; i++) {
			const k = i / len;
			const x = sx + dir * i;
			const ground = surface[Math.max(0, Math.min(W - 1, Math.round(x)))] - 1;
			const y = Math.round(
				Math.min(ground, sy + Math.sin(k * Math.PI * 0.5) * (groundY - sy))
			);
			for (let yy = Math.min(prev, y); yy <= Math.max(prev, y); yy++) set(x, yy, color);
			prev = y;
		}
	}

	// ── 半埋的鍵盤 ──
	{
		const kx = rx - 30;
		const ky = surface[Math.max(0, kx)] - 3;
		for (let i = 0; i < 16; i++) {
			const dy = Math.round(i * 0.12);
			set(kx + i, ky + dy, C.casingLight);
			set(kx + i, ky + dy + 1, i % 2 === 0 ? C.key : C.casing);
			set(kx + i, ky + dy + 2, C.casing);
		}
	}

	// ── 機櫃外框 ──
	rect(rx, ry, rw, groundY - ry + 1, C.metalDark);
	for (let y = ry; y <= groundY; y++) {
		set(rx, y, C.edge);
		set(rx + 1, y, C.metal);
		set(rx + rw - 2, y, C.metal);
		set(rx + rw - 1, y, C.metalLight);
	}
	for (let x = rx; x < rx + rw; x++) {
		set(x, ry, C.edge);
		set(x, ry + 1, C.metalLight);
		set(x, ry + 2, C.metal);
	}
	// 鏽斑：越靠近地面越多
	for (let n = 0; n < 70; n++) {
		const y = Math.round(ry + Math.sqrt(rng()) * (groundY - ry));
		const side = rng();
		const x =
			side < 0.4
				? rx + randInt(0, 1)
				: side < 0.8
					? rx + rw - randInt(1, 2)
					: rx + randInt(0, rw - 1);
		if (side >= 0.8 && y > ry + 2) continue;
		set(x, y, rng() < 0.4 ? C.rustLight : C.rust);
	}

	// ── 機架上的伺服器 ──
	type Unit = { h: number; state: 'alive' | 'dead' | 'pulled' | 'missing' };
	const units: Unit[] = [
		{ h: 4, state: 'dead' },
		{ h: 6, state: 'alive' },
		{ h: 4, state: 'missing' },
		{ h: 4, state: 'pulled' },
		{ h: 6, state: 'dead' },
		{ h: 4, state: 'dead' }
	];
	let uy = ry + 4;
	const ix = rx + 3;
	const iw = rw - 6;
	for (const [ui, u] of units.entries()) {
		if (u.state === 'missing') {
			rect(ix, uy, iw, u.h, C.vent);
			// 空槽裡垂下的排線
			const lx = ix + randInt(6, iw - 6);
			for (let j = 0; j < u.h + randInt(1, 3); j++)
				set(lx + (j > 2 ? 1 : 0), uy + j, C.cable);
			uy += u.h + 1;
			continue;
		}
		const shift = u.state === 'pulled' ? 6 : 0;
		for (let j = 0; j < u.h; j++)
			for (let i = 0; i < iw; i++) {
				// 被拉出來的那台尾端微微下垂
				const droop = u.state === 'pulled' && i > iw - 8 ? 1 : 0;
				let c = j === 0 ? C.metalLight : j === u.h - 1 ? C.metalDark : C.metal;
				if (j > 0 && j < u.h - 1 && i > 8 && i < iw - 4 && (i + j) % 2 === 0) c = C.vent;
				set(ix + shift + i, uy + j + droop, c);
			}
		// 把手
		set(ix + shift, uy + 1, C.edge);
		set(ix + shift, uy + u.h - 2, C.edge);
		set(ix + shift + iw - 1, uy + 1, C.edge);
		set(ix + shift + iw - 1, uy + u.h - 2, C.edge);

		const ly = uy + Math.floor(u.h / 2);
		// 開機時由上而下逐台亮起
		const awake = installed && bootT > 0.3 + ui * 0.35;
		if (awake) {
			set(ix + shift + 3, ly, blink(1.6, 0.8, ui * 0.37) ? C.ledGreen : C.ledGreenOff);
			const hdd = Math.sin(t * (6 + ui) + ui) + Math.sin(t * 2.9 + ui * 2) > 0.9;
			set(ix + shift + 5, ly, hdd ? C.ledAmber : C.ledAmberOff);
			set(ix + shift + 7, ly, C.ledGreen);
		} else if (u.state === 'alive') {
			// 最後一台還在跑：電源燈緩慢呼吸、硬碟燈偶爾閃一下
			set(ix + 3, ly, blink(3.2, 0.55) ? C.ledGreen : C.ledGreenOff);
			const hdd = Math.sin(t * 7.3) + Math.sin(t * 3.1 + 1) > 1.2;
			set(ix + 5, ly, hdd ? C.ledAmber : C.ledAmberOff);
			set(ix + 7, ly, C.ledGreenOff);
		} else {
			set(ix + shift + 3, ly, C.ledGreenOff);
			set(ix + shift + 5, ly, ui % 3 === 0 ? C.ledRedOff : C.ledAmberOff);
		}
		uy += u.h + 1;
	}

	// ── 電源模組與空電池槽 ──
	const pmY = uy + 1;
	rect(ix, pmY, iw, groundY - pmY - 1, C.metal);
	for (let i = 0; i < iw; i++) set(ix + i, pmY, C.metalLight);
	// 警示斜紋
	for (let i = 0; i < iw; i++) if ((i >> 1) % 2 === 0) set(ix + i, pmY + 1, C.rust);
	const slot = { x: ix + 4, y: pmY + 3, w: 16, h: 6 };
	rect(slot.x - 1, slot.y - 1, slot.w + 2, slot.h + 2, C.metalLight);
	rect(slot.x, slot.y, slot.w, slot.h, C.slot);
	set(slot.x + slot.w - 1, slot.y + 2, C.copper);
	set(slot.x + slot.w - 1, slot.y + 3, C.copper);
	if (installed) battery(slot.x, slot.y, 1);
	// 電量表：沒電時五格只剩一格在苟延殘喘，裝上電池後逐格充滿
	const meterX = slot.x + slot.w + 4;
	for (let i = 0; i < 5; i++) {
		let c = C.ledAmberOff;
		if (installed) c = bootT > 0.4 + i * 0.4 ? C.ledGreen : C.ledGreenOff;
		else if (i === 0 && (blink(1.1, 0.7) || Math.sin(t * 13) > 0.6)) c = C.ledAmber;
		rect(meterX + i * 3, slot.y + 1, 2, 3, c);
	}
	set(meterX, slot.y + 5, !installed && blink(0.9, 0.5) ? C.ledRed : C.ledRedOff);

	// ── 脫落的機櫃門，斜靠在左側 ──
	for (let j = 0; j < rh - 8; j++) {
		const x0 = rx - 3 - Math.round((j / (rh - 8)) * 5);
		const y = ry + 6 + j;
		for (let i = 0; i < 4; i++) {
			const mesh = (i + j) % 2 === 0;
			set(x0 + i, y, i === 0 ? C.edge : mesh ? C.metal : C.metalDark);
		}
		if (rng() < 0.12) set(x0 + randInt(0, 3), y, C.rust);
	}

	// ── 機櫃上的 CRT 螢幕 ──
	const mw = 20;
	const mh = 14;
	const mx = rx + 6;
	const my = ry - mh;
	const crt = { x: mx, y: my, w: mw, h: mh };
	{
		rect(mx, my, mw, mh, C.casing);
		for (let i = 0; i < mw; i++) set(mx + i, my, C.casingLight);
		for (let j = 0; j < mh; j++) set(mx, my + j, C.casingLight);
		rect(mx + 4, my + mh, mw - 8, 1, C.casingLight);
		const sx = mx + 2;
		const sy = my + 2;
		const sw = mw - 4;
		const sh = mh - 5;
		rect(sx, sy, sw, sh, C.screen);
		// 電力不穩時整個畫面會暗一下
		const flicker = !installed && Math.sin(t * 23) + Math.sin(t * 5.7) > 1.6 ? 0.35 : 1;
		const lines = [
			[1, 6],
			[1, 9],
			[1, 4]
		];
		if (installed && !booted) {
			// 開機自檢：文字一行行往上捲
			const scroll = Math.floor(bootT * 8);
			for (let j = 0; j < 4; j++) {
				const len = 3 + (((scroll + j) * 5) % 11);
				for (let i = 0; i < Math.min(len, sw - 2); i++)
					set(sx + 1 + i, sy + 1 + j * 2, C.glow, 0.8);
			}
		} else {
			lines.forEach(([x0, len], j) => {
				for (let i = 0; i < len; i++)
					if ((i * 7 + j * 3) % 5 !== 0)
						set(
							sx + x0 + i,
							sy + 1 + j * 2,
							booted ? C.glow : C.glowDim,
							flicker * (booted ? 0.7 : 1)
						);
			});
		}
		if (booted && state.updateReady) {
			// 有可用更新：閃爍的下載箭頭與琥珀色外框
			const on = blink(0.9, 0.6);
			const bx = sx + sw - 5;
			const by = sy;
			const c = on ? C.ledAmber : C.ledAmberOff;
			for (let j = 0; j < 4; j++) set(bx + 1, by + j, c);
			set(bx, by + 2, c);
			set(bx + 2, by + 2, c);
			for (let i = -1; i <= 3; i++) set(bx + i, by + 5, c);
			if (on) {
				for (let i = 0; i < mw; i++) {
					set(mx + i, my, C.ledAmber, 0.5);
					set(mx + i, my + mh - 1, C.ledAmber, 0.5);
				}
				for (let j = 0; j < mh; j++) {
					set(mx, my + j, C.ledAmber, 0.5);
					set(mx + mw - 1, my + j, C.ledAmber, 0.5);
				}
			}
		} else if (booted) {
			// 打勾
			const bx = sx + sw - 6;
			const by = sy + 1;
			for (const [dx, dy] of [
				[0, 2],
				[1, 3],
				[2, 2],
				[3, 1],
				[4, 0]
			])
				set(bx + dx, by + dy, C.glow);
		}
		// 低電量警告：閃爍的電池圖示與游標
		if (!installed && blink(1.4, 0.6)) {
			const bx = sx + sw - 6;
			const by = sy + 1;
			for (let i = 0; i < 4; i++) {
				set(bx + i, by, C.glow, flicker);
				set(bx + i, by + 2, C.glow, flicker);
			}
			set(bx, by + 1, C.glow, flicker);
			set(bx + 3, by + 1, C.glow, flicker);
			set(bx + 4, by + 1, C.glow, flicker);
			set(bx + 1, by + 1, C.ledRed, flicker);
		}
		if (blink(1, 0.5)) rect(sx + 1, sy + 7, 2, 1, C.glow);
		// 掃描線
		for (let j = 1; j < sh; j += 2)
			for (let i = 0; i < sw; i++) set(sx + i, sy + j, C.screen, 0.35);
		for (let n = 0; n < 6; n++) set(mx + randInt(1, mw - 2), my + mh - 1, C.rust);
	}

	// ── 爬上機櫃的藤蔓 ──
	const sway = (x: number, h: number) =>
		Math.sin(t * 1.1 + x * 0.13) * Math.sin(t * 0.37 + x * 0.05) * h * 0.12;
	{
		const vx = rx + rw - 1;
		let x = vx;
		for (let y = groundY; y > ry - 1; y--) {
			x = vx + Math.round(Math.sin(y * 0.4) * 1.2);
			set(x, y, C.vine);
			if (y % 3 === 0) {
				const s = Math.sin(y * 1.7) > 0 ? 1 : -1;
				set(x + s, y, C.leaf);
				set(x + s * 2, y - 1, C.leaf);
			}
		}
		// 爬過頂部後垂下來
		for (let i = 0; i < 18; i++) {
			const x2 = vx - i;
			set(x2, ry - 1 + (i % 5 === 0 ? 1 : 0), C.vine);
			if (i % 4 === 1) set(x2, ry - 2, C.leaf);
			if (i % 6 === 3)
				for (let j = 1; j < randInt(3, 9); j++)
					set(x2, ry + j, j % 3 === 0 ? C.leaf : C.vine);
		}
		const lx = rx;
		for (let y = groundY; y > groundY - 22; y--) {
			const x3 = lx + Math.round(Math.sin(y * 0.5) * 1.1);
			set(x3, y, C.vine);
			if (y % 4 === 0) set(x3 + (y % 8 === 0 ? 1 : -1), y, C.leaf);
		}
	}

	// ── 太陽能充電座 ──
	const stW = 22;
	const stX = Math.round(Math.min(W - stW - 2, cx + rw / 2 + 26));
	const housingTop = groundY - 17;
	const station = { x: stX + 3, y: housingTop + 6, w: 16, h: 6 };
	{
		// 水泥底座
		rect(stX - 2, groundY - 3, stW + 4, 5, C.concrete);
		for (let i = -2; i < stW + 2; i++) set(stX + i, groundY - 3, C.concreteLight);
		// 機箱
		rect(stX, housingTop, stW, groundY - 3 - housingTop, C.metal);
		for (let i = 0; i < stW; i++) set(stX + i, housingTop, C.edge);
		for (let j = 0; j < groundY - 3 - housingTop; j++) {
			set(stX, housingTop + j, C.metalLight);
			set(stX + stW - 1, housingTop + j, C.metalDark);
		}
		for (let n = 0; n < 10; n++)
			set(stX + randInt(0, stW - 1), randInt(housingTop + 1, groundY - 4), C.rust);
		rect(station.x - 1, station.y - 1, station.w + 2, station.h + 2, C.metalLight);
		rect(station.x, station.y, station.w, station.h, C.slot);
		set(station.x + station.w - 1, station.y + 2, C.copper);
		set(station.x + station.w - 1, station.y + 3, C.copper);

		const { progress } = state;
		if (state.station !== 'empty') battery(station.x, station.y, progress);

		// 充電格與狀態燈
		const segs = 4;
		for (let i = 0; i < segs; i++) {
			let c = C.ledGreenOff;
			if (state.station === 'full') c = C.ledGreen;
			else if (state.station === 'charging') {
				const done = progress * segs;
				if (i < Math.floor(done) || (i === Math.floor(done) && blink(0.6, 0.5)))
					c = C.ledGreen;
			}
			rect(stX + 3 + i * 4, housingTop + 2, 3, 2, c);
		}
		const led =
			state.station === 'full'
				? C.ledGreen
				: state.station === 'charging'
					? blink(0.8, 0.5)
						? C.ledAmber
						: C.ledAmberOff
					: C.ledRed;
		set(stX + stW - 3, housingTop + 2, led);
		set(stX + stW - 3, housingTop + 3, led, 0.5);

		// 支柱與傾斜的太陽能板，有一道裂痕
		const poleX = stX + stW - 5;
		const poleTop = housingTop - 12;
		for (let y = poleTop; y < housingTop; y++) set(poleX, y, C.metalLight);
		const pw = 22;
		const ph = 6;
		const pX = poleX - pw + 6;
		for (let j = 0; j < ph; j++)
			for (let i = 0; i < pw; i++) {
				const x = pX + i + j;
				const y = poleTop - ph + j;
				const frame = j === 0 || j === ph - 1 || i === 0 || i === pw - 1;
				let c = frame ? C.metalLight : i % 4 === 0 || j === 3 ? C.panelGrid : C.panel;
				if (!frame && Math.abs(i - 9 - j * 1.5) < 0.6) c = C.panelCrack;
				set(x, y, c);
				// 充電時光澤掃過面板
				if (!frame && state.station === 'charging') {
					const g = ((t * 12) % (pw + 10)) - 5;
					if (Math.abs(i - j - g) < 1.2) set(x, y, C.panelGlint, 0.6);
				}
			}
		// 面板到機箱的電線
		for (let y = poleTop; y < housingTop; y++) set(poleX + 2, y, C.cable);
	}

	// ── 雜草：越靠近機櫃越茂密越高 ──
	const grassRng = mulberry32(seed + 7);
	for (let x = 0; x < W; x++) {
		const near = Math.max(0, 1 - Math.abs(x - cx) / (rw * 1.6));
		const density = 0.35 + near * 0.6;
		if (grassRng() > density) continue;
		let h = Math.round(2 + grassRng() * 4 + near * near * grassRng() * 14);
		// 機櫃與充電座正前方的草被踩矮了，插槽才看得到
		if (Math.abs(x - cx) < rw / 2 - 2 || (x >= stX && x < stX + stW)) h = Math.min(h, 4);
		const lean = (grassRng() - 0.5) * 0.4;
		const base = surface[x];
		const shade = Math.min(3, Math.floor(grassRng() * 2 + near * 2));
		for (let j = 0; j < h; j++) {
			const k = j / h;
			const dx = Math.round(lean * j + sway(x, h) * k * k);
			set(x + dx, base - j, C.grass[j > h * 0.6 ? Math.min(3, shade + 1) : shade]);
		}
		if (h > 10 && grassRng() < 0.35) {
			const dx = Math.round(lean * h + sway(x, h));
			const fc = C.flower[Math.floor(grassRng() * C.flower.length)];
			set(x + dx, base - h, fc);
			set(x + dx - 1, base - h + 1, fc, 0.6);
			set(x + dx + 1, base - h + 1, fc, 0.6);
		}
	}

	// ── 螢火蟲 ──
	const flyRng = mulberry32(seed + 13);
	for (let n = 0; n < 5; n++) {
		const ox = cx + (flyRng() - 0.5) * rw * 3;
		const oy = groundY - 8 - flyRng() * 30;
		const sp = 0.2 + flyRng() * 0.3;
		const ph = flyRng() * 10;
		const x = ox + Math.sin(t * sp + ph) * 14 + Math.sin(t * sp * 2.3 + ph) * 5;
		const y = oy + Math.sin(t * sp * 1.7 + ph * 2) * 6;
		const a = Math.max(0, Math.sin(t * 1.3 + ph * 3));
		if (a <= 0.05) continue;
		set(x, y, C.firefly, a);
		set(x + 1, y, C.firefly, a * 0.25);
		set(x - 1, y, C.firefly, a * 0.25);
		set(x, y - 1, C.firefly, a * 0.25);
		set(x, y + 1, C.firefly, a * 0.25);
	}

	return { data, slot, station, crt };
}
