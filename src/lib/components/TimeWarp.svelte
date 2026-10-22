<script lang="ts">
	import { untrack } from 'svelte';
	import { era } from '$lib/era.svelte';

	const REBUILD_MS = 3600;
	const COLLAPSE_MS = 2600;

	let playing = false;

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	async function play(direction: 'forward' | 'back') {
		playing = true;
		const root = document.documentElement;
		const forward = direction === 'forward';

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			era.swap();
			era.done();
			playing = false;
			return;
		}

		root.classList.add('warp-glitch');
		if (!forward) root.classList.add('warp-decay');
		await wait(forward ? 900 : 700);
		root.classList.remove('warp-glitch', 'warp-decay');

		root.classList.add('warp-hide-ui');
		await wait(600);

		const ms = forward ? REBUILD_MS : COLLAPSE_MS;
		era.startSweep(direction, ms);
		await wait(ms + 500);

		era.endSweep();
		era.swap();
		window.scrollTo({ top: 0 });
		await wait(300);
		root.classList.remove('warp-hide-ui');
		await wait(700);

		playing = false;
		era.done();
	}

	$effect(() => {
		const w = era.warping;
		if (w && untrack(() => !playing)) play(w);
	});
</script>

<style>
	/* 電流湧入：套在 html 而不是 body，避免 filter/transform 讓 fixed 背景跑位 */
	:global(html.warp-glitch) {
		animation: warp-glitch 0.9s steps(12) both;
	}

	:global(html.warp-decay) {
		animation-duration: 0.7s;
	}

	@keyframes -global-warp-glitch {
		0% {
			filter: none;
			transform: none;
		}
		15% {
			filter: brightness(1.8) contrast(1.4);
			transform: translate(-3px, 1px);
		}
		30% {
			filter: hue-rotate(60deg) saturate(2);
			transform: translate(4px, -2px) skewX(2deg);
		}
		45% {
			filter: brightness(0.4);
			transform: translate(0, 3px);
		}
		60% {
			filter: invert(0.15) brightness(2);
			transform: translate(-5px, 0) skewX(-3deg);
		}
		80% {
			filter: brightness(1.6) contrast(1.4);
			transform: scale(1.01);
		}
		100% {
			filter: none;
			transform: none;
		}
	}
</style>
