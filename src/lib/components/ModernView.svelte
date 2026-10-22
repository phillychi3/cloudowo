<script lang="ts">
	import { onMount } from 'svelte';
	import { era } from '$lib/era.svelte';
	import { renderArm, solveElbow, type P } from '$lib/modern/arm';
	import TerminalContent, { type Tab } from './TerminalContent.svelte';

	type Post = { title: string; link: string; pubDate?: string };
	type Project = { name: string; description: string; url: string };
	type Friend = { name: string; url: string };
	type Banner = { image: string; link: string };

	let {
		currentTime,
		posts,
		projects,
		friends,
		banners
	}: {
		currentTime: string;
		posts: Post[];
		projects: Project[];
		friends: Friend[];
		banners: Banner[];
	} = $props();

	const KEY = 'cloudowo:term';
	const TABS: [Tab, string][] = [
		['home', '~'],
		['projects', 'projects'],
		['blog', 'blog'],
		['friends', 'friends']
	];

	let tab = $state<Tab>('home');
	let canvas: HTMLCanvasElement;

	let vw = $state(0);
	let vh = $state(0);
	let size = $state({ w: 600, h: 440 });
	let pos = $state({ x: 0, y: 0 });
	/** 0 = 伸出，1 = 收進牆裡 */
	let k = $state(1);
	let docked = $state(true);
	let dragging = $state(false);
	let nearDock = $state(false);

	let scale = $state(3);
	let railX = $state(0);
	let lh = $state(0);
	let reach = $state(0);

	const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
	// 收回分兩段：先把視窗拉回牆邊縮小，再把整支手臂縮進牆裡
	const e = $derived(ease(Math.min(1, k / 0.7)));
	const slide = $derived(ease(Math.max(0, (k - 0.7) / 0.3)));
	const attach = $derived({ x: pos.x + size.w, y: pos.y + size.h / 2 });
	// 基座沿牆上滑軌追蹤視窗高度，手臂才能一直大致水平地伸出去
	const railY = (y: number) => Math.min(Math.max(y / scale, 12), lh - 12);
	const base = $derived<P>({ x: railX, y: railY(attach.y) });
	const dockAt = $derived({ x: base.x * scale - 8, y: base.y * scale });
	const windowStyle = $derived.by(() => {
		const dx = (dockAt.x - attach.x) * e;
		const dy = (dockAt.y - attach.y) * e;
		const op = e < 0.75 ? 1 : 1 - (e - 0.75) / 0.25;
		return `left:${pos.x}px;top:${pos.y}px;width:${size.w}px;height:${size.h}px;transform:translate(${dx}px,${dy}px) scale(${1 - 0.92 * e});opacity:${op}`;
	});

	function save() {
		try {
			localStorage.setItem(KEY, JSON.stringify({ x: pos.x, y: pos.y, docked }));
		} catch {
			/* 存不了就算了 */
		}
	}

	// 視窗夾點不能超出機械臂的伸展範圍，也不能跑出畫面
	function clampPos(x: number, y: number) {
		x = Math.min(Math.max(8, x), vw - size.w - 8);
		y = Math.min(Math.max(8, y), vh - size.h - 8);
		const ax = (x + size.w) / scale;
		const ay = (y + size.h / 2) / scale;
		const by = railY(y + size.h / 2);
		const d = Math.hypot(ax - railX, ay - by);
		if (d > reach) {
			const f = reach / d;
			x = (railX + (ax - railX) * f) * scale - size.w;
			y = (by + (ay - by) * f) * scale - size.h / 2;
		}
		return { x, y };
	}

	let anim = 0;
	function animateTo(target: 0 | 1, ms = 800) {
		cancelAnimationFrame(anim);
		const from = k;
		const start = performance.now();
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const step = (now: number) => {
			const t = reduce ? 1 : Math.min(1, (now - start) / ms);
			k = from + (target - from) * t;
			if (t < 1) anim = requestAnimationFrame(step);
		};
		anim = requestAnimationFrame(step);
	}

	function retract() {
		docked = true;
		animateTo(1);
		save();
	}

	function extend() {
		docked = false;
		animateTo(0);
		save();
	}

	let grab: { dx: number; dy: number; id: number } | null = null;

	function onDown(ev: PointerEvent) {
		if ((ev.target as HTMLElement).closest('button')) return;
		grab = { dx: ev.clientX - pos.x, dy: ev.clientY - pos.y, id: ev.pointerId };
		(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
		dragging = true;
	}

	function onMove(ev: PointerEvent) {
		if (!grab || ev.pointerId !== grab.id) return;
		const wantX = ev.clientX - grab.dx;
		pos = clampPos(wantX, ev.clientY - grab.dy);
		// 往右推到牆邊就準備收回
		nearDock = wantX + size.w > vw - 24;
	}

	function onUp(ev: PointerEvent) {
		if (!grab || ev.pointerId !== grab.id) return;
		grab = null;
		dragging = false;
		if (nearDock) {
			nearDock = false;
			pos = clampPos(vw - size.w - 40, pos.y);
			retract();
		} else save();
	}

	const defaultPos = () => ({ x: vw * 0.06, y: vh * 0.12 });

	function layout() {
		vw = window.innerWidth;
		vh = window.innerHeight;
		scale = Math.max(3, Math.round(Math.max(vw, vh) / 320));
		const lw = Math.ceil(vw / scale);
		lh = Math.ceil(vh / scale);
		canvas.width = lw;
		canvas.height = lh;
		canvas.style.width = `${lw * scale}px`;
		canvas.style.height = `${lh * scale}px`;
		railX = lw - 5;
		size = {
			w: Math.min(620, vw - 40),
			h: Math.min(460, Math.round(vh * 0.68))
		};
		// 手臂長度依預設位置決定：預設姿勢微彎，往左拖到底剛好伸直
		const def = defaultPos();
		reach = Math.max(30, (railX - (def.x + size.w) / scale) * 1.15);
		pos = clampPos(pos.x, pos.y);
	}

	function drawArm(t: number) {
		if (!canvas) return;
		const ctx = canvas.getContext('2d')!;
		const shift = slide * 40;
		const b = { x: base.x + shift, y: base.y };
		// 夾在視窗右緣外側，手臂從視窗後面伸過來
		const wrist = {
			x: (attach.x + (dockAt.x - attach.x) * e) / scale + 2 + shift,
			y: (attach.y + (dockAt.y - attach.y) * e) / scale
		};
		// 伸縮臂：每節長度跟著距離走，不論遠近都維持同樣的微彎角度
		const d = Math.hypot(wrist.x - b.x, wrist.y - b.y);
		const half = Math.min(reach / 2, Math.max(8, d * 0.6));
		const elbow = solveElbow(b, wrist, half, half);
		const data = renderArm(canvas.width, canvas.height, b, elbow, wrist, t);
		ctx.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0);
	}

	$effect(() => {
		void e;
		void slide;
		void attach;
		void vw;
		drawArm(performance.now() / 1000);
	});

	onMount(() => {
		let saved: { x?: number; y?: number; docked?: boolean } = {};
		try {
			saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		} catch {
			/* 沒存過 */
		}
		layout();
		const def = defaultPos();
		pos = clampPos(saved.x ?? def.x, saved.y ?? def.y);
		k = 1;
		docked = true;
		// 機械臂把終端機遞出來
		const hello = saved.docked ? 0 : setTimeout(extend, 700);

		const onResize = () => layout();
		window.addEventListener('resize', onResize);
		const led = setInterval(() => drawArm(performance.now() / 1000), 420);
		return () => {
			clearTimeout(hello);
			clearInterval(led);
			cancelAnimationFrame(anim);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="desktop modern-ui">
	<section
		class="window"
		class:dragging
		class:hidden={k >= 1}
		style={windowStyle}
		aria-label="終端機"
		inert={docked && k > 0.5}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<header
			class="titlebar"
			onpointerdown={onDown}
			onpointermove={onMove}
			onpointerup={onUp}
			onpointercancel={onUp}
		>
			<span class="name">whitecloud@cloudowo</span>
			<nav class="tabs" aria-label="分頁">
				{#each TABS as [id, label] (id)}
					<button class="tab" class:active={tab === id} onclick={() => (tab = id)}>{label}</button>
				{/each}
			</nav>
			<button class="retract" onclick={retract} title="收回側邊" aria-label="收回終端機">
				<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"
					><path d="M3 8h9M9 4l4 4-4 4M14 2v12" fill="none" stroke="currentColor" stroke-width="1.6" /></svg
				>
			</button>
		</header>

		<TerminalContent bind:tab {posts} {projects} {friends} {banners} />

		<footer class="status">
			<span class="clock">{currentTime || '--:--:--'}</span>
			<span class="spacer"></span>
			<button class="rollback" onclick={() => era.goBack()} title="回到廢墟">rollback</button>
		</footer>
	</section>

	<canvas bind:this={canvas} class="arm" class:near={nearDock} aria-hidden="true"></canvas>

	{#if docked && k >= 1}
		<button class="dock" style:top="{dockAt.y}px" onclick={extend} aria-label="伸出終端機">
			<span class="led" aria-hidden="true"></span>
			<span class="label">TERMINAL</span>
		</button>
	{/if}
</div>

<style>
	.desktop {
		position: fixed;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		font-family: 'Maple Mono NF CN', 'JetBrains Mono', ui-monospace, monospace;
	}

	.window {
		--fg: #e4dcef;
		--dim: #8a7fa0;
		--mint: #8ee6bf;
		--cyan: #7fd3f0;
		--blue: #a8b6ff;
		--yellow: #ffd27a;
		--red: #ff7d7d;

		position: absolute;
		z-index: 2;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(226, 150, 122, 0.4);
		border-radius: 10px;
		background: rgba(22, 16, 36, 0.82);
		backdrop-filter: blur(10px) saturate(1.2);
		box-shadow:
			0 24px 60px rgba(10, 4, 20, 0.55),
			inset 0 1px 0 rgba(255, 220, 190, 0.08);
		color: var(--fg);
		font-size: 13px;
		line-height: 1.7;
		transform-origin: right center;
		pointer-events: auto;
		overflow: hidden;
		will-change: transform;
	}

	.window.dragging {
		box-shadow:
			0 30px 80px rgba(10, 4, 20, 0.7),
			inset 0 1px 0 rgba(255, 220, 190, 0.08);
	}

	.window.hidden {
		visibility: hidden;
	}

	.titlebar {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 36px;
		padding: 0 6px 0 12px;
		background: linear-gradient(#30264a, #241c38);
		border-bottom: 1px solid rgba(226, 150, 122, 0.25);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.dragging .titlebar {
		cursor: grabbing;
	}

	.led {
		width: 7px;
		height: 7px;
		flex: none;
		border-radius: 50%;
		background: #8ee6bf;
		box-shadow: 0 0 6px #8ee6bf;
	}

	.name {
		color: var(--dim);
		font-size: 12px;
		white-space: nowrap;
	}

	.tabs {
		display: flex;
		gap: 2px;
		margin-left: auto;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.tab {
		padding: 3px 10px;
		border: none;
		border-radius: 5px;
		background: none;
		color: var(--dim);
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.tab:hover {
		color: var(--fg);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: #1a1428;
		background: var(--yellow);
	}

	.retract {
		display: grid;
		place-items: center;
		width: 28px;
		height: 26px;
		border: none;
		border-radius: 5px;
		background: none;
		color: var(--dim);
		cursor: pointer;
	}

	.retract:hover {
		color: var(--yellow);
		background: rgba(255, 210, 122, 0.1);
	}

	.status {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 26px;
		padding: 0 6px 0 12px;
		border-top: 1px solid rgba(226, 150, 122, 0.2);
		background: rgba(0, 0, 0, 0.2);
		color: var(--dim);
		font-size: 12px;
	}

	.clock {
		font-variant-numeric: tabular-nums;
	}

	.spacer {
		flex: 1;
	}

	.rollback {
		padding: 0 8px;
		border: none;
		background: none;
		color: var(--dim);
		font: inherit;
		cursor: pointer;
	}

	.rollback:hover {
		color: var(--red);
	}

	.arm {
		position: absolute;
		left: 0;
		top: 0;
		z-index: 1;
		image-rendering: pixelated;
		transition: filter 0.2s;
	}

	.arm.near {
		filter: brightness(1.3) drop-shadow(0 0 6px rgba(255, 210, 122, 0.6));
	}

	.dock {
		position: absolute;
		right: 0;
		z-index: 4;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px 6px;
		transform: translateY(-50%);
		border: 1px solid rgba(226, 150, 122, 0.45);
		border-right: none;
		border-radius: 8px 0 0 8px;
		background: rgba(36, 28, 56, 0.85);
		color: #ffd27a;
		font: inherit;
		font-size: 11px;
		letter-spacing: 0.2em;
		cursor: pointer;
		pointer-events: auto;
		animation: dock-in 0.4s ease-out;
	}

	.dock:hover {
		background: rgba(56, 44, 84, 0.95);
	}

	.dock .label {
		writing-mode: vertical-rl;
	}

	.dock .led {
		animation: pulse 1.6s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}

	@keyframes dock-in {
		from {
			transform: translate(100%, -50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dock,
		.dock .led {
			animation: none;
		}
	}
</style>
