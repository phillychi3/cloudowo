import { LAYER, type CityFrame, type RGB } from './city';

export type Put = (x: number, y: number, c: RGB, alpha?: number) => void;

const COLOR = {
	car: [46, 72, 64] as RGB,
	carLight: [170, 125, 50] as RGB,
	chase: [60, 150, 125] as RGB,
	slit: [70, 210, 175] as RGB,
	steam: [80, 110, 100] as RGB
};

type Puff = { x: number; y: number; born: number; drift: number };

export function createActors(frame: CityFrame, rand: () => number = Math.random) {
	const { width: W, height: H, scene, lights } = frame;
	const { tower } = scene;
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

	function draw(put: Put, t: number) {
		const dt = Math.min(0.25, last ? t - last : 0);
		last = t;
		const onMega = masked(put, LAYER.mega, true);
		const inSky = masked(put, LAYER.mega);

		// 警示燈與接觸不良的窗光
		lights.forEach((l, i) => {
			if (l.kind === 'beacon') lightOn[i] = t % 2.4 < 0.25;
			else if (rand() < dt * 0.8) lightOn[i] = rand() < 0.7;
			put(l.x, l.y, lightOn[i] ? l.on : l.off);
		});


		{
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
			const y = Math.round(tower.carMax + (tower.carMin - tower.carMax) * ease);
			for (let dy = 0; dy < 4; dy++)
				for (let dx = -1; dx <= 1; dx++) onMega(tower.railX + dx, y + dy, dy === 1 && dx === 0 ? COLOR.carLight : COLOR.car);
		}

		// 主平台的跑馬燈
		{
			const n = tower.chase.length;
			const head = Math.floor(t * 7) % (n + 10);
			for (let k = 0; k < 3; k++) {
				const p = tower.chase[head - k];
				if (p) onMega(p.x, p.y, COLOR.chase, 0.9 - k * 0.3);
			}
		}

		// 核心觀察縫的呼吸光
		{
			const a = 0.25 + 0.2 * Math.sin(t * 1.3);
			const { x, y0, y1 } = tower.slit;
			for (let y = y0; y <= y1; y++) onMega(x, y, COLOR.slit, a * (0.6 + 0.4 * Math.sin(y * 0.7 - t * 3)));
		}

		// 排氣口蒸氣
		if (t >= nextPuff) {
			nextPuff = t + 0.35 + rand() * 0.4;
			const v = tower.vents[Math.floor(rand() * tower.vents.length)];
			if (v) puffs.push({ x: v.x, y: v.y, born: t, drift: 0.8 + rand() * 1.5 });
		}
		puffs = puffs.filter((p) => t - p.born < 5);
		for (const p of puffs) {
			const age = t - p.born;
			const x = p.x - age * p.drift + Math.sin(age * 2 + p.drift) * 0.8;
			const y = p.y - age * 3;
			const a = 0.3 * (1 - age / 5);
			inSky(x, y, COLOR.steam, a);
			if (age > 1.2) inSky(x - 1, y, COLOR.steam, a * 0.6);
			if (age > 2.5) inSky(x, y - 1, COLOR.steam, a * 0.5);
		}
	}

	return { draw };
}
