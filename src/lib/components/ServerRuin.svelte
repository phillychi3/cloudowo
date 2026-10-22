<script lang="ts">
	import { onMount } from 'svelte';
	import { renderServer, type ServerState } from '$lib/ruins/server';
	import { quest } from '$lib/ruins/quest.svelte';
	import { era } from '$lib/era.svelte';

	const H = 80;
	const PAD = 10;

	type Box = { left: number; top: number; width: number; height: number };

	let wrap: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let slotBox = $state<Box>();
	let stationBox = $state<Box>();
	let crtBox = $state<Box>();

	function currentState(now: number): ServerState {
		const installed = quest.battery === 'installed';
		return {
			station:
				quest.battery === 'charging' ? 'charging' : quest.battery === 'charged' ? 'full' : 'empty',
			progress: quest.chargeProgress(now),
			installed,
			bootT: installed ? (now - quest.installedAt) / 1000 : 0,
			updateReady: quest.updateReady
		};
	}

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let px = 3;

		const toBox = (r: { x: number; y: number; w: number; h: number }): Box => ({
			left: r.x * px - PAD,
			top: r.y * px - PAD,
			width: r.w * px + PAD * 2,
			height: r.h * px + PAD * 2
		});

		function draw(now: number) {
			if (!canvas.width) return;
			const frame = renderServer(
				canvas.width,
				canvas.height,
				reduceMotion ? 0 : now / 1000,
				currentState(now)
			);
			ctx.putImageData(new ImageData(frame.data, canvas.width, canvas.height), 0, 0);
			return frame;
		}

		function resize() {
			px = wrap.clientWidth < 640 ? 2 : 3;
			const w = Math.ceil(wrap.clientWidth / px);
			// 已穿越的訪客在 JS 接手前廢墟是 display:none，寬度為 0
			if (!w || w === canvas.width) return;
			canvas.width = w;
			canvas.height = H;
			canvas.style.width = `${w * px}px`;
			canvas.style.height = `${H * px}px`;
			const frame = draw(performance.now())!;
			slotBox = toBox(frame.slot);
			stationBox = toBox(frame.station);
			crtBox = toBox(frame.crt);
		}

		const ro = new ResizeObserver(resize);
		ro.observe(wrap);
		resize();

		let raf = 0;
		let lastDraw = 0;
		const loop = (now: number) => {
			raf = requestAnimationFrame(loop);
			if (now - lastDraw < 100) return;
			lastDraw = now;
			draw(now);
		};
		raf = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});

	const style = (b: Box) =>
		`left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px`;
</script>

<div class="server-ruin" bind:this={wrap}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	{#if slotBox}
		<button
			class="hotspot"
			class:target={quest.carrying}
			style={style(slotBox)}
			aria-label="伺服器的電池槽"
			onclick={() => quest.useServer()}
		></button>
	{/if}
	{#if stationBox}
		<button
			class="hotspot"
			class:target={quest.carrying || quest.battery === 'charged'}
			style={style(stationBox)}
			aria-label="太陽能充電座"
			onclick={() => quest.useStation()}
		></button>
	{/if}
	{#if crtBox && quest.updateReady}
		<button
			class="hotspot target"
			style={style(crtBox)}
			aria-label="安裝系統更新"
			onclick={() => era.travel()}
		></button>
	{/if}
</div>

<style>
	.server-ruin {
		position: relative;
		width: 100%;
		overflow: hidden;
		line-height: 0;
		margin-top: 2rem;
	}

	.server-ruin canvas {
		display: block;
		image-rendering: pixelated;
	}

	.hotspot {
		position: absolute;
		background: transparent;
		border: 1px dashed transparent;
		cursor: pointer;
		padding: 0;
	}

	.hotspot:hover,
	.hotspot:focus-visible {
		border-color: rgba(0, 255, 150, 0.5);
		outline: none;
	}

	/* 拿著電池時提示可以放的位置 */
	.hotspot.target {
		border-color: rgba(0, 255, 150, 0.35);
		animation: pulse 1.2s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			border-color: rgba(0, 255, 150, 0.9);
			box-shadow: 0 0 10px rgba(0, 255, 150, 0.4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hotspot.target {
			animation: none;
			border-color: rgba(0, 255, 150, 0.8);
		}
	}
</style>
