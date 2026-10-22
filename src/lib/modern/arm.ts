import type { RGB } from '$lib/ruins/city';

export type P = { x: number; y: number };

const hex = (s: string): RGB => [
	parseInt(s.slice(1, 3), 16),
	parseInt(s.slice(3, 5), 16),
	parseInt(s.slice(5, 7), 16)
];

const C = {
	body: hex('#4a3d66'),
	dark: hex('#2a2240'),
	shadow: hex('#1c1630'),
	rim: hex('#e2967a'),
	seam: hex('#3a2f54'),
	hazard: hex('#e8b04a'),
	joint: hex('#241d38'),
	jointRing: hex('#6a5a8a'),
	led: hex('#ffd27a'),
	ledOff: hex('#5a4630'),
	piston: hex('#9a8cb8'),
	cable: hex('#15111f')
};

/** 兩節 IK：手肘一律往下彎 */
export function solveElbow(b: P, t: P, l1: number, l2: number): P {
	const dx = t.x - b.x;
	const dy = t.y - b.y;
	const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
	const base = Math.atan2(dy, dx);
	const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
	const e1 = { x: b.x + Math.cos(base + a) * l1, y: b.y + Math.sin(base + a) * l1 };
	const e2 = { x: b.x + Math.cos(base - a) * l1, y: b.y + Math.sin(base - a) * l1 };
	return e1.y > e2.y ? e1 : e2;
}

export function renderArm(W: number, H: number, base: P, elbow: P, wrist: P, t: number) {
	const data = new Uint8ClampedArray(W * H * 4);
	const set = (x: number, y: number, c: RGB) => {
		x = Math.round(x);
		y = Math.round(y);
		if (x < 0 || y < 0 || x >= W || y >= H) return;
		const i = (y * W + x) * 4;
		data[i] = c[0];
		data[i + 1] = c[1];
		data[i + 2] = c[2];
		data[i + 3] = 255;
	};

	const line = (a: P, b: P, c: RGB) => {
		const n = Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)));
		for (let i = 0; i <= n; i++) set(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, c);
	};

	// 手臂一節：沿線段掃描，上緣打暖色輪廓光，下緣壓暗，每隔一段一條接縫
	const segment = (a: P, b: P, w: number, hazard: number) => {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len = Math.hypot(dx, dy) || 1;
		let nx = -dy / len;
		let ny = dx / len;
		if (ny > 0) {
			nx = -nx;
			ny = -ny;
		}
		const pad = w + 1;
		const x0 = Math.floor(Math.min(a.x, b.x) - pad);
		const x1 = Math.ceil(Math.max(a.x, b.x) + pad);
		const y0 = Math.floor(Math.min(a.y, b.y) - pad);
		const y1 = Math.ceil(Math.max(a.y, b.y) + pad);
		for (let y = y0; y <= y1; y++)
			for (let x = x0; x <= x1; x++) {
				const px = x + 0.5 - a.x;
				const py = y + 0.5 - a.y;
				const u = (px * dx + py * dy) / (len * len);
				if (u < 0 || u > 1) continue;
				const s = px * nx + py * ny;
				if (Math.abs(s) > w / 2) continue;
				const along = u * len;
				let c = C.body;
				if (s > w / 2 - 1) c = C.rim;
				else if (s < -w / 2 + 1) c = C.shadow;
				else if (s < 0) c = C.dark;
				else if (Math.floor(along) % 9 === 0) c = C.seam;
				if (along < hazard && s <= w / 2 - 1 && s >= -w / 2 + 1 && Math.floor(along + s * 2) % 4 < 2) c = C.hazard;
				set(x, y, c);
			}
	};

	const joint = (p: P, r: number, ledOn: boolean) => {
		for (let y = Math.floor(p.y - r - 1); y <= p.y + r + 1; y++)
			for (let x = Math.floor(p.x - r - 1); x <= p.x + r + 1; x++) {
				const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y);
				if (d > r) continue;
				set(x, y, d > r - 1 ? (y < p.y ? C.rim : C.jointRing) : C.joint);
			}
		set(p.x, p.y, ledOn ? C.led : C.ledOff);
	};

	// 纜線：從基座垂到手腕
	{
		const a = { x: base.x - 1, y: base.y + 3 };
		const ctrl = { x: (a.x + elbow.x) / 2, y: Math.max(a.y, elbow.y) + 10 };
		let prev = a;
		for (let i = 1; i <= 24; i++) {
			const k = i / 24;
			const p = {
				x: (1 - k) ** 2 * a.x + 2 * (1 - k) * k * ctrl.x + k * k * elbow.x,
				y: (1 - k) ** 2 * a.y + 2 * (1 - k) * k * ctrl.y + k * k * elbow.y
			};
			line(prev, p, C.cable);
			prev = p;
		}
	}

	// 牆上的垂直滑軌，基座沿著它追蹤視窗高度
	if (base.x < W) for (let y = 0; y < H; y++) {
		set(W - 1, y, C.dark);
		set(W - 2, y, y % 6 === 0 ? C.jointRing : C.shadow);
	}

	// 滑座
	for (let y = Math.round(base.y - 9); y <= base.y + 9; y++)
		for (let x = Math.round(base.x - 3); x < W; x++) {
			const edge = y === Math.round(base.y - 9);
			set(x, y, edge ? C.rim : x === Math.round(base.x - 3) ? C.jointRing : C.dark);
		}
	set(base.x - 1, base.y - 6, C.jointRing);
	set(base.x - 1, base.y + 6, C.jointRing);

	segment(base, elbow, 8, 10);
	// 液壓桿：從基座下方撐到上臂中段
	{
		const mid = { x: base.x + (elbow.x - base.x) * 0.45, y: base.y + (elbow.y - base.y) * 0.45 };
		const foot = { x: base.x - 2, y: base.y + 7 };
		const k = 0.55;
		const join = { x: foot.x + (mid.x - foot.x) * k, y: foot.y + (mid.y - foot.y) * k };
		line(foot, join, C.dark);
		line({ x: foot.x, y: foot.y - 1 }, { x: join.x, y: join.y - 1 }, C.dark);
		line(join, mid, C.piston);
	}
	segment(elbow, wrist, 6, 0);

	const blink = Math.floor(t * 1.2) % 2 === 0;
	joint(base, 6, blink);
	joint(elbow, 5, !blink);

	// 夾爪：咬住視窗右緣
	{
		const dx = wrist.x - elbow.x;
		const dy = wrist.y - elbow.y;
		const len = Math.hypot(dx, dy) || 1;
		const ux = dx / len;
		const uy = dy / len;
		for (const side of [-1, 1]) {
			const ox = -uy * side * 4;
			const oy = ux * side * 4;
			line({ x: wrist.x + ox, y: wrist.y + oy }, { x: wrist.x + ox + ux * 4, y: wrist.y + oy + uy * 4 }, C.jointRing);
			line({ x: wrist.x + ox * 0.75, y: wrist.y + oy * 0.75 }, { x: wrist.x + ox * 0.75 + ux * 4, y: wrist.y + oy * 0.75 + uy * 4 }, C.dark);
		}
		joint(wrist, 3, true);
	}

	return data;
}
