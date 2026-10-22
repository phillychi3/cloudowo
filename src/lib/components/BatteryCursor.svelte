<script lang="ts">
	import { onMount } from 'svelte';
	import { quest } from '$lib/ruins/quest.svelte';
	import BatterySprite from './BatterySprite.svelte';

	let x = $state(0);
	let y = $state(0);

	onMount(() => {
		const move = (e: PointerEvent) => {
			x = e.clientX;
			y = e.clientY;
		};
		const key = (e: KeyboardEvent) => {
			if (e.key === 'Escape') quest.cancel();
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerdown', move);
		window.addEventListener('keydown', key);
		return () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerdown', move);
			window.removeEventListener('keydown', key);
		};
	});
</script>

{#if quest.carrying}
	<div class="carried" style:left="{x + 14}px" style:top="{y + 14}px">
		<BatterySprite full={quest.full} />
	</div>
{/if}

{#if quest.message}
	<div class="toast" role="status">
		<span class="prompt">&gt;</span>
		{quest.message}
	</div>
{/if}

<style>
	.carried {
		position: fixed;
		z-index: 10000;
		pointer-events: none;
		filter: drop-shadow(0 0 6px rgba(0, 255, 150, 0.35));
		animation: bob 1.2s ease-in-out infinite;
	}

	@keyframes bob {
		50% {
			transform: translateY(-3px);
		}
	}

	.toast {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 10000;
		max-width: calc(100vw - 32px);
		padding: 8px 14px;
		background: #000;
		border: 1px solid #00ff96;
		box-shadow: 0 0 12px rgba(0, 255, 150, 0.4);
		color: #ccc;
		font-family: 'Noto Sans Mono', monospace;
		font-size: 13px;
		pointer-events: none;
	}

	.prompt {
		color: #00ff96;
		margin-right: 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		.carried {
			animation: none;
		}
	}
</style>
