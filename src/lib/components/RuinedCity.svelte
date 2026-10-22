<script lang="ts">
	import { onMount } from 'svelte';
	import { renderCity } from '$lib/ruins/city';
	import { createActors, type Put } from '$lib/ruins/actors';
	import { createFlyers } from '$lib/ruins/flyers';

	let base: HTMLCanvasElement;
	let overlay: HTMLCanvasElement;
	let sky: HTMLCanvasElement;

	onMount(() => {
		const baseCtx = base.getContext('2d')!;
		const ctx = overlay.getContext('2d')!;
		const skyCtx = sky.getContext('2d')!;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let actors: ReturnType<typeof createActors> | undefined;
		let flyers: ReturnType<typeof createFlyers> | undefined;
		let size = '';

		const putOn =
			(c2d: CanvasRenderingContext2D): Put =>
			(x, y, c, a = 1) => {
				c2d.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
				c2d.fillRect(Math.round(x), Math.round(y), 1, 1);
			};
		const put = putOn(ctx);
		const putSky = putOn(skyCtx);

		function frame(t: number) {
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
			const w = Math.ceil(vw / scale);
			const h = Math.ceil(vh / scale);
			if (`${w}x${h}` === size) return;
			size = `${w}x${h}`;

			const city = renderCity(w, h);
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

			baseCtx.putImageData(new ImageData(city.data, w, h), 0, 0);
			actors = createActors(city);
			flyers = createFlyers(city, K);
			frame(performance.now());
		}

		let resizeTimer: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(build, 200);
		};

		build();
		window.addEventListener('resize', onResize);

		// 約 15fps，保留像素動畫的頓挫感，也比較省電
		let raf = 0;
		let lastDraw = 0;
		const loop = (t: number) => {
			raf = requestAnimationFrame(loop);
			if (t - lastDraw < 66) return;
			lastDraw = t;
			frame(t);
		};
		if (!reduceMotion) raf = requestAnimationFrame(loop);

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
