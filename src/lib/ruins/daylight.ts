import { LAYER, dither, hex, type CityFrame, type RGB } from './city';

/** 某個時刻的整體光影 */
export type Light = {
	/** 天空漸層（上、下），以 skyA 疊在原本的天空上 */
	skyTop: RGB;
	skyLow: RGB;
	skyA: number;
	/** 非發光像素的亮度倍率 */
	mul: number;
	/** 環境光色，越遠的圖層吃越多，做出空氣透視 */
	tint: RGB;
	tintA: number;
	/** 發光像素保留原色的程度：夜裡 1，白天燈光就不顯眼 */
	glow: number;
	/** 輪廓光：side < 0 太陽在左（東），> 0 在右（西），top 是屋頂受光 */
	rim: RGB;
	side: number;
	top: number;
};

type Key = [hour: number, light: Light];

const L = (
	skyTop: string,
	skyLow: string,
	skyA: number,
	mul: number,
	tint: string,
	tintA: number,
	glow: number,
	rim = '#000000',
	side = 0,
	top = 0
): Light => ({
	skyTop: hex(skyTop),
	skyLow: hex(skyLow),
	skyA,
	mul,
	tint: hex(tint),
	tintA,
	glow,
	rim: hex(rim),
	side,
	top
});

// 廢墟原畫就是深夜，白天是灰濛濛的霾
const RUINS_NIGHT = L('#000000', '#000000', 0, 1, '#000000', 0, 1);
const RUINS: Key[] = [
	[0, RUINS_NIGHT],
	[4.5, RUINS_NIGHT],
	[5.5, L('#0a0f1c', '#3a3048', 0.5, 1.15, '#1a1e30', 0.08, 1)],
	[6.5, L('#2a3550', '#e0855a', 0.75, 1.7, '#c07050', 0.14, 0.7, '#ffb070', -0.55, 0.15)],
	[9, L('#4f6e7a', '#a0b8b0', 0.85, 2.5, '#8aa4a0', 0.2, 0.3, '#e8e0c0', -0.3, 0.25)],
	[12.5, L('#5f808a', '#b0c4bc', 0.9, 2.8, '#9ab0aa', 0.22, 0.2, '#f4f0e0', 0, 0.35)],
	[16, L('#56707a', '#b8b8a0', 0.85, 2.5, '#a8a890', 0.2, 0.3, '#f0d8a8', 0.3, 0.25)],
	[17.8, L('#2a2040', '#d06848', 0.72, 1.6, '#b06048', 0.15, 0.7, '#ff9060', 0.55, 0.15)],
	[19, L('#0c1020', '#3a2a38', 0.45, 1.1, '#20202c', 0.06, 1)],
	[20.5, RUINS_NIGHT]
];

// 全盛版原畫是黃昏
const MODERN_DUSK = L('#000000', '#000000', 0, 1, '#000000', 0, 1, '#ffb070', 0.35, 0.1);
const MODERN_NIGHT = L('#05061a', '#1a1a3a', 0.85, 0.45, '#101030', 0.15, 1);
const MODERN: Key[] = [
	[0, MODERN_NIGHT],
	[4.5, MODERN_NIGHT],
	[5.5, L('#1a1a40', '#5a4a70', 0.6, 0.6, '#303060', 0.12, 1)],
	[6.5, L('#3a4a80', '#ffb080', 0.45, 0.85, '#ff9a70', 0.1, 0.8, '#ffc890', -0.5, 0.15)],
	[10, L('#4a88d0', '#b8e0f0', 0.8, 1.5, '#a8c8e8', 0.18, 0.25, '#fff4d8', -0.25, 0.25)],
	[13, L('#3a80d8', '#c0e4f4', 0.85, 1.7, '#b0d0ee', 0.2, 0.2, '#ffffff', 0, 0.3)],
	[16, L('#5080c0', '#f0d0a0', 0.6, 1.35, '#f0c890', 0.14, 0.35, '#ffd8a0', 0.4, 0.2)],
	[18, MODERN_DUSK],
	[19.5, L('#10123a', '#4a3a70', 0.55, 0.7, '#303070', 0.1, 1)],
	[21, MODERN_NIGHT]
];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/** 依當地時間在關鍵影格之間內插，hour 可帶小數 */
export function lightAt(hour: number, restored: boolean): Light {
	const keys = restored ? MODERN : RUINS;
	hour = ((hour % 24) + 24) % 24;
	let i = keys.length - 1;
	while (keys[i][0] > hour) i--;
	const [h0, a] = keys[i];
	const [h1, b] = i + 1 < keys.length ? keys[i + 1] : [24, keys[0][1]];
	const t = (hour - h0) / (h1 - h0);
	const k = t * t * (3 - 2 * t);
	return {
		skyTop: mixRGB(a.skyTop, b.skyTop, k),
		skyLow: mixRGB(a.skyLow, b.skyLow, k),
		skyA: mix(a.skyA, b.skyA, k),
		mul: mix(a.mul, b.mul, k),
		tint: mixRGB(a.tint, b.tint, k),
		tintA: mix(a.tintA, b.tintA, k),
		glow: mix(a.glow, b.glow, k),
		rim: mixRGB(a.rim, b.rim, k),
		side: mix(a.side, b.side, k),
		top: mix(a.top, b.top, k)
	};
}

/** 網址帶 ?hour=14.5 可以預覽任何時刻 */
export function currentHour(): number {
	const q = parseFloat(new URLSearchParams(location.search).get('hour') ?? '');
	if (Number.isFinite(q)) return q;
	const d = new Date();
	return d.getHours() + d.getMinutes() / 60;
}

// 遠處吃比較多環境光
const DEPTH = [0, 1, 0.8, 0.45, 0.3];

export function applyLight(city: CityFrame, light: Light): ImageData {
	const { width: W, height: H, data: src, glow, scene } = city;
	const layer = scene.layer;
	const out = new Uint8ClampedArray(src.length);
	const { mul, tint, tintA, rim, side, top, skyA } = light;
	const dir = side < 0 ? -1 : 1;
	const sideA = Math.abs(side);

	// 天空也走粗顆粒的色帶，跟原畫一致
	const BANDS = 10;
	const bands: RGB[] = [];
	for (let i = 0; i < BANDS; i++) bands.push(mixRGB(light.skyTop, light.skyLow, i / (BANDS - 1)));

	for (let y = 0; y < H; y++) {
		const v = (y / H) * (BANDS - 1);
		const bi = Math.floor(v);
		const bf = v - bi;
		for (let x = 0; x < W; x++) {
			const p = y * W + x;
			const i = p * 4;
			let r = src[i];
			let g = src[i + 1];
			let b = src[i + 2];
			const l = layer[p];

			if (l === LAYER.sky) {
				if (skyA > 0) {
					const s = bf > dither(x, y) ? bands[Math.min(bi + 1, BANDS - 1)] : bands[bi];
					r = mix(r, s[0], skyA);
					g = mix(g, s[1], skyA);
					b = mix(b, s[2], skyA);
				}
			} else {
				const ta = tintA * DEPTH[l];
				let lr = mix(r * mul, tint[0], ta);
				let lg = mix(g * mul, tint[1], ta);
				let lb = mix(b * mul, tint[2], ta);

				// 輪廓光：朝太陽那側、或上方緊鄰更遠的圖層，就是受光的邊
				let ra = 0;
				const nx = x + dir;
				if (sideA > 0 && nx >= 0 && nx < W && layer[p + dir] < l) ra = sideA;
				if (top > 0 && y > 0 && layer[p - W] < l) ra = Math.max(ra, top);
				if (ra > 0) {
					lr = mix(lr, rim[0], ra);
					lg = mix(lg, rim[1], ra);
					lb = mix(lb, rim[2], ra);
				}

				const e = (glow[p] / 255) * light.glow;
				r = mix(lr, r, e);
				g = mix(lg, g, e);
				b = mix(lb, b, e);
			}

			out[i] = r;
			out[i + 1] = g;
			out[i + 2] = b;
			out[i + 3] = 255;
		}
	}
	return new ImageData(out, W, H);
}

/** 疊加層（角色、飛行物）用同一套光，夜裡維持原本的亮色 */
export function toneOf(light: Light): (c: RGB) => RGB {
	const { mul, tint, glow } = light;
	const ta = light.tintA * DEPTH[LAYER.mid];
	return (c) => {
		const lit: RGB = [mix(c[0] * mul, tint[0], ta), mix(c[1] * mul, tint[1], ta), mix(c[2] * mul, tint[2], ta)];
		return mixRGB(lit, c, glow).map((v) => Math.max(0, Math.min(255, Math.round(v)))) as RGB;
	};
}
