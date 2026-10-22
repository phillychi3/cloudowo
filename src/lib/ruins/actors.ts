import { LAYER, type CityFrame, type RGB } from './city';

export type Put = (x: number, y: number, c: RGB, alpha?: number) => void;

const RUINS = {
	car: [46, 72, 64] as RGB,
	carLight: [170, 125, 50] as RGB,
	chase: [60, 150, 125] as RGB,
	slit: [70, 210, 175] as RGB,
	steam: [80, 110, 100] as RGB
};

const DUSK: typeof RUINS = {
	car: [232, 224, 240],
	carLight: [255, 233, 176],
	chase: [255, 210, 122],
	slit: [255, 226, 160],
	steam: [240, 200, 200]
};

const TRAIN = {
	body: [216, 208, 232] as RGB,
	roof: [240, 232, 255] as RGB,
	window: [255, 233, 176] as RGB,
	head: [255, 255, 255] as RGB,
	ring: [255, 214, 140] as RGB
};

type Puff = { x: number; y: number; born: number; drift: number };

export function createActors(frame: CityFrame, rand: () => number = Math.random) {
	const { width: W, height: H, scene, lights } = frame;
	const { tower, restored, ring, bridge } = scene;
	const COLOR = restored ? DUSK : RUINS;
	const layerAt = (x: number, y: number) => scene.layer[y * W + x];

	const masked = (put: Put, maxLayer: number, exact = false): Put => {
		return (x, y, c, a) => {
			x = Math.round(x);
			y = Math.round(y);
			if (x < 0 || y < 0 || x >= W || y >= H) return;
			const l = layerAt(x, y);
			if (exact ? l === maxLayer : l <= maxLayer) put(x, y, c, a);
		};
	};

	const lightOn = lights.map(() => true);

	let puffs: Puff[] = [];
	let nextPuff = 0;
	let last = 0;

	const drawCar = (put: Put, y: number) => {
		for (let dy = 0; dy < 4; dy++)
			for (let dx = -1; dx <= 1; dx++)
				put(tower.railX + dx, y + dy, dy === 1 && dx === 0 ? COLOR.carLight : COLOR.car);
	};

	function draw(put: Put, t: number) {
		const dt = Math.min(0.25, last ? t - last : 0);
		last = t;
		const onMega = masked(put, LAYER.mega, true);
		const inSky = masked(put, LAYER.mega);

		lights.forEach((l, i) => {
			if (l.kind === 'beacon') lightOn[i] = t % 2.4 < 0.25;
			else if (rand() < dt * (restored ? 0.1 : 0.8)) lightOn[i] = rand() < (restored ? 0.9 : 0.7);
			put(l.x, l.y, lightOn[i] ? l.on : l.off);
		});

		if (restored) {
			// 全盛時期：好幾台升降梯持續往返雲端
			const span = tower.carMax - tower.carMin + 12;
			for (const [speed, offset] of [
				[9, 0],
				[9, span * 0.5],
				[-7, span * 0.3]
			]) {
				const p = (((t * speed + offset) % span) + span) % span;
				drawCar(onMega, Math.round(tower.carMax - p));
			}
		} else {
			// 上去、停一下、下來，永遠沒有目的地
			const travel = 38;
			const wait = 4;
			const cycle = (travel + wait) * 2;
			const p = t % cycle;
			let k: number;
			if (p < travel) k = p / travel;
			else if (p < travel + wait) k = 1;
			else if (p < travel * 2 + wait) k = 1 - (p - travel - wait) / travel;
			else k = 0;
			const ease = k * k * (3 - 2 * k);
			drawCar(onMega, Math.round(tower.carMax + (tower.carMin - tower.carMax) * ease));
		}

		{
			const n = tower.chase.length;
			const heads = restored ? [0, Math.floor(n / 2)] : [0];
			for (const h0 of heads) {
				const head = (Math.floor(t * (restored ? 12 : 7)) + h0) % (n + 10);
				for (let k = 0; k < 3; k++) {
					const p = tower.chase[head - k];
					if (p) onMega(p.x, p.y, COLOR.chase, 0.9 - k * 0.3);
				}
			}
		}

		{
			const a = restored ? 0.55 + 0.25 * Math.sin(t * 2) : 0.25 + 0.2 * Math.sin(t * 1.3);
			const { x, y0, y1 } = tower.slit;
			for (let y = y0; y <= y1; y++) onMega(x, y, COLOR.slit, a * (0.6 + 0.4 * Math.sin(y * 0.7 - t * 3)));
		}

		if (t >= nextPuff) {
			nextPuff = t + (restored ? 1.2 : 0.35) + rand() * 0.4;
			const v = tower.vents[Math.floor(rand() * tower.vents.length)];
			if (v) puffs.push({ x: v.x, y: v.y, born: t, drift: 0.8 + rand() * 1.5 });
		}
		puffs = puffs.filter((p) => t - p.born < 5);
		for (const p of puffs) {
			const age = t - p.born;
			const x = p.x - age * p.drift + Math.sin(age * 2 + p.drift) * 0.8;
			const y = p.y - age * 3;
			const a = (restored ? 0.18 : 0.3) * (1 - age / 5);
			inSky(x, y, COLOR.steam, a);
			if (age > 1.2) inSky(x - 1, y, COLOR.steam, a * 0.6);
			if (age > 2.5) inSky(x, y - 1, COLOR.steam, a * 0.5);
		}

		if (!restored) return;

		// 巨環上流動的光帶
		for (const phase of [0, 0.5]) {
			const head = 15 + ((t * 0.08 + phase) % 1) * 150;
			for (let a = head - 10; a <= head; a += 0.4) {
				if (a < 15) continue;
				const rad = (a * Math.PI) / 180;
				const k = 1 - (head - a) / 10;
				for (let r = ring.R - ring.th + 1; r < ring.R; r++)
					onMega(ring.cx + Math.cos(rad) * r, ring.cy - Math.sin(rad) * r, TRAIN.ring, 0.75 * k);
			}
		}

		// 高架巨橋上的列車
		{
			const cars = 4;
			const len = cars * 10;
			const loop = bridge.x1 + len + 80;
			const head = ((t * 26) % loop) - 40;
			const top = bridge.y - 3;
			for (let i = 0; i < len; i++) {
				const x = Math.round(head - i);
				if (x < 0 || x >= bridge.x1) continue;
				if (i % 10 === 9) continue;
				inSky(x, top, TRAIN.roof);
				inSky(x, top + 1, i % 2 === 0 && i % 10 > 1 && i % 10 < 8 ? TRAIN.window : TRAIN.body);
				inSky(x, top + 2, TRAIN.body);
			}
			if (head >= 0 && head < bridge.x1) {
				inSky(head + 1, top + 1, TRAIN.head);
				for (let k = 2; k < 8; k++) inSky(head + k, top + 1, TRAIN.head, 0.35 * (1 - k / 8));
			}
		}
	}

	return { draw };
}
