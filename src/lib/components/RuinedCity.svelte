<script lang="ts">
	import { onMount } from 'svelte';
	import { renderCity, type RGB } from '$lib/ruins/city';
	import { createActors, type Put } from '$lib/ruins/actors';
	import { createFlyers } from '$lib/ruins/flyers';
	import { era, type Sweep } from '$lib/era.svelte';

	let { restored = false }: { restored?: boolean } = $props();

	let base: HTMLCanvasElement;
	let overlay: HTMLCanvasElement;
	let sky: HTMLCanvasElement;
	let rebuild: (() => void) | undefined;

	$effect(() => {
		void restored;
		rebuild?.();
	});

	const SWEEP_FORWARD: RGB = [255, 226, 160];
	const SWEEP_BACK: RGB = [255, 80, 80];

	onMount(() => {
		const baseCtx = base.getContext('2d')!;
		const ctx = overlay.getContext('2d')!;
		const skyCtx = sky.getContext('2d')!;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let actors: ReturnType<typeof createActors> | undefined;
		let flyers: ReturnType<typeof createFlyers> | undefined;
		let size = '';
		let w = 0;
		let h = 0;
		let current: ImageData | undefined;

		let activeSweep: Sweep | null = null;
		const target = document.createElement('canvas');

		const putOn =
			(c2d: CanvasRenderingContext2D): Put =>
			(x, y, c, a = 1) => {
				c2d.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
				c2d.fillRect(Math.round(x), Math.round(y), 1, 1);
			};
		const put = putOn(ctx);
		const putSky = putOn(skyCtx);

		// 已穿越的訪客在 era.load() 之前就要畫全盛版，避免先閃一下廢墟
		const isRestored = () => restored || document.documentElement.dataset.era === 'modern';

		function drawSweep(sw: Sweep, now: number) {
			if (sw !== activeSweep) {
				activeSweep = sw;
				const city = renderCity(w, h, undefined, sw.dir === 'forward');
				target.width = w;
				target.height = h;
				target.getContext('2d')!.putImageData(new ImageData(city.data, w, h), 0, 0);
			}
			const k = Math.min(1, Math.max(0, (now - sw.start) / sw.ms));
			const p = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
			const forward = sw.dir === 'forward';
			// 往前：由下往上重建；回去：由上往下崩壞
			const line = Math.round(forward ? h * (1 - p) : h * p);

			if (current) baseCtx.putImageData(current, 0, 0);
			if (forward) baseCtx.drawImage(target, 0, line, w, h - line, 0, line, w, h - line);
			else baseCtx.drawImage(target, 0, 0, w, line, 0, 0, w, line);

			ctx.clearRect(0, 0, overlay.width, overlay.height);
			skyCtx.clearRect(0, 0, sky.width, sky.height);
			if (k >= 1) return;
			const c = forward ? SWEEP_FORWARD : SWEEP_BACK;
			const dir = forward ? 1 : -1;
			for (let x = 0; x < w; x++) put(x, line, c, 0.95);
			for (let r = 1; r < 8; r++) {
				const a = 0.35 * (1 - r / 8);
				for (let x = 0; x < w; x++) put(x, line + dir * r, c, a);
			}
			for (let n = 0; n < w * 0.15; n++) {
				const x = Math.floor(Math.random() * w);
				const y = line - dir * Math.floor(Math.random() * 14);
				put(x, y, c, Math.random() * 0.8);
			}
		}

		function frame(t: number) {
			const sw = era.sweep;
			if (sw && w) return drawSweep(sw, t);
			if (activeSweep) activeSweep = null;
			if (!actors || !flyers) return;
			ctx.clearRect(0, 0, overlay.width, overlay.height);
			skyCtx.clearRect(0, 0, sky.width, sky.height);
			actors.draw(put, t / 1000);
			flyers.draw(putSky, t / 1000);
		}

		function build() {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			// 以長邊約 320 像素為基準，維持粗顆粒的像素感
			const scale = Math.max(3, Math.round(Math.max(vw, vh) / 320));
			w = Math.ceil(vw / scale);
			h = Math.ceil(vh / scale);
			if (`${w}x${h}` === size) return;
			size = `${w}x${h}`;

			const city = renderCity(w, h, undefined, isRestored());
			for (const c of [base, overlay]) {
				c.width = w;
				c.height = h;
				c.style.width = `${w * scale}px`;
				c.style.height = `${h * scale}px`;
			}
			// 飛行物用更細的像素，約 2 個螢幕像素一格
			const K = Math.max(2, Math.round(scale / 2));
			sky.width = w * K;
			sky.height = h * K;
			sky.style.width = `${w * scale}px`;
			sky.style.height = `${h * scale}px`;

			current = new ImageData(city.data, w, h);
			baseCtx.putImageData(current, 0, 0);
			actors = createActors(city);
			flyers = createFlyers(city, K);
			activeSweep = null;
			frame(performance.now());
		}

		let resizeTimer: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(build, 200);
		};

		build();
		rebuild = () => {
			size = '';
			build();
		};
		window.addEventListener('resize', onResize);

		// 平常約 15fps 保留像素動畫的頓挫感；重建掃描時全速，掃描線才順
		let raf = 0;
		let lastDraw = 0;
		const loop = (t: number) => {
			raf = requestAnimationFrame(loop);
			if (!era.sweep && (reduceMotion || t - lastDraw < 66)) return;
			lastDraw = t;
			frame(t);
		};
		raf = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(resizeTimer);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<div class="ruined-city" aria-hidden="true">
	<canvas bind:this={base}></canvas>
	<canvas bind:this={overlay}></canvas>
	<canvas bind:this={sky}></canvas>
</div>

<style>
	.ruined-city {
		position: fixed;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		overflow: hidden;
	}

	.ruined-city canvas {
		position: absolute;
		left: 0;
		bottom: 0;
		image-rendering: pixelated;
	}
</style>
