
import type { CityFrame, RGB } from './city';
import type { Put } from './actors';

const PALETTE: Record<string, RGB> = {
	a: [30, 41, 37],
	b: [44, 58, 53],
	h: [74, 93, 86],
	e: [95, 255, 192],
	l: [200, 48, 48],
	r: [90, 110, 102],
	x: [34, 46, 42]
};


const DRONE = [
	['rrrr.....rrrr', '.a.........a.', '.aaabbbbbaaa.', '....bhhhb....', '.....beb.....', '......l......'],
	['.rr.r...r.rr.', '.a.........a.', '.aaabbbbbaaa.', '....bhhhb....', '.....beb.....', '......l......']
];


const BIRD = [
	['x.......x', '.x.....x.', '..xx.xx..', '....a....'],
	['.........', 'xxx...xxx', '...xxx...', '....a....'],
	['.........', '..xx.xx..', '.x..a..x.', 'x.......x'],
	['.........', 'xxx...xxx', '...xxx...', '....a....']
];

const BEAM: RGB = [95, 255, 190];

type Drone = { x: number; y: number; tx: number; ty: number; roof: number; scanUntil: number };
type Bird = { dx: number; dy: number; phase: number };
type Flock = { x: number; y: number; dir: number; speed: number; birds: Bird[] };

export function createFlyers(frame: CityFrame, K: number, rand: () => number = Math.random) {
	const W = frame.width * K;
	const H = frame.height * K;
	const groundY = frame.scene.groundY * K;
	const S = frame.scene.S * K;
	const roofs = frame.scene.roofs.map((r) => ({ x: r.x * K, w: r.w * K, top: r.top * K }));

	const sprite = (put: Put, rows: string[], cx: number, cy: number, hide = '') => {
		const ox = Math.round(cx - rows[0].length / 2);
		const oy = Math.round(cy);
		rows.forEach((row, j) => {
			for (let i = 0; i < row.length; i++) {
				const ch = row[i];
				if (ch === '.' || hide.includes(ch)) continue;
				put(ox + i, oy + j, PALETTE[ch], ch === 'r' ? 0.7 : 1);
			}
		});
	};

	const drones: Drone[] = [];
	const droneCount = roofs.length === 0 ? 0 : W > 220 * K ? 2 : 1;
	for (let i = 0; i < droneCount; i++) {
		const x = rand() * W;
		const y = groundY - S * (0.5 + rand() * 0.2);
		drones.push({ x, y, tx: x, ty: y, roof: -1, scanUntil: 0 });
	}
	const pickRoof = (d: Drone) => {
		const taken = new Set(drones.map((o) => o.roof));
		let r = Math.floor(rand() * roofs.length);
		for (let k = 0; k < roofs.length && taken.has(r); k++) r = (r + 1) % roofs.length;
		const roof = roofs[r];
		d.roof = r;
		d.tx = roof.x + roof.w / 2;
		d.ty = roof.top - (10 + rand() * 8) * K;
	};

	let flocks: Flock[] = [];
	let nextFlock = 3 + rand() * 6;
	const spawnFlock = () => {
		const dir = rand() < 0.5 ? 1 : -1;
		const n = 3 + Math.floor(rand() * 4);
		const birds: Bird[] = [];
		for (let i = 0; i < n; i++) {
			const side = i % 2 === 0 ? 1 : -1;
			const rank = Math.ceil(i / 2);
			birds.push({
				dx: (-dir * rank * 9 + rand() * 4) * (K / 3),
				dy: (side * rank * 5 + rand() * 3) * (K / 3),
				phase: rand() * 4
			});
		}
		flocks.push({
			x: dir > 0 ? -20 * K : W + 20 * K,
			y: H * 0.1 + rand() * Math.max(10 * K, groundY - S * 0.6 - H * 0.1),
			dir,
			speed: (12 + rand() * 8) * K,
			birds
		});
	};

	let last = 0;

	function draw(put: Put, t: number) {
		const dt = Math.min(0.25, last ? t - last : 0);
		last = t;

		for (const d of drones) {
			const dist = Math.hypot(d.tx - d.x, d.ty - d.y);
			if (d.roof < 0) pickRoof(d);
			else if (dist > 0.5) {
				const step = Math.min(dist, 11 * K * dt);
				d.x += ((d.tx - d.x) / dist) * step;
				d.y += ((d.ty - d.y) / dist) * step;
				d.scanUntil = t + 3 + rand() * 3;
			} else if (t > d.scanUntil) pickRoof(d);

			const scanning = d.roof >= 0 && Math.hypot(d.tx - d.x, d.ty - d.y) <= 0.5;

			const x = Math.round(d.x);
			const y = Math.round(d.y + Math.sin(t * 3 + d.tx) * K * 0.6);


			if (scanning) {
				const roof = roofs[d.roof];
				const sweep = roof.x + roof.w / 2 + Math.sin(t * 2.2) * roof.w * 0.4;
				const y0 = y + 5;
				const h = roof.top - y0;
				for (let r = 0; r <= h; r++) {
					const k = r / h;
					const cx = x + (sweep - x) * k;
					const half = Math.round(k * 2.5 * K);
					for (let dx = -half; dx <= half; dx++) {
						const edge = Math.abs(dx) >= half - 1 ? 0.12 : 0.05;
						put(Math.round(cx) + dx, y0 + r, BEAM, edge);
					}
				}
				for (let dx = -2 * K; dx <= 2 * K; dx++) {
					put(Math.round(sweep) + dx, roof.top, BEAM, 0.5);
					put(Math.round(sweep) + dx, roof.top + 1, BEAM, 0.2);
				}
			}

			const spin = Math.floor(t * 16) % 2;
			sprite(put, DRONE[spin], x, y, t % 1 < 0.15 ? '' : 'l');
		}

		if (t >= nextFlock) {
			spawnFlock();
			nextFlock = t + 12 + rand() * 18;
		}
		flocks = flocks.filter((f) => f.x > -40 * K && f.x < W + 40 * K);
		for (const f of flocks) {
			f.x += f.dir * f.speed * dt;
			for (const b of f.birds) {
				const bx = f.x + b.dx;
				const by = f.y + b.dy + Math.sin(t * 1.5 + b.phase) * K * 0.8;
				sprite(put, BIRD[Math.floor(t * 8 + b.phase) % 4], bx, by);
			}
		}
	}

	return { draw };
}
