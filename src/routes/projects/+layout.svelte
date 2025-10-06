<script lang="ts">
	import type { LayoutProps } from './$types';
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';

	let { data, children }: LayoutProps = $props();

	let isSubRoute = $derived(page.route.id !== '/projects');
	let projects = [
		{
			name: 'Lithium Player',
			description: 'A lightweight music player built with Svelte.',
			repository: 'https://github.com/cl0udlab/Lithium-player',
			icon: 'mdi:music-note',
			slug: 'LithiumPlayer'
		},
		{
			name: 'Yet Another Server Status',
			description: 'Yet Another Server Status',
			repository: 'https://github.com/cl0udlab/YASS',
			icon: 'mdi:chart-line',
			slug: 'YASS'
		},
		{
			name: 'AnyKnowledge',
			description: 'Your personal AI 「KEEP」, support docx, pdf, audio, video...',
			repository: 'https://github.com/waifu-lab/anyknowledge',
			icon: 'mdi:brain',
			slug: 'anyknowledge'
		},
		{
			name: 'rt-picture-system',
			description: '返圖系統',
			repository: 'https://github.com/phillychi3/rt-picture-system',
			icon: 'mdi:image-multiple',
			slug: 'rtpic'
		}
	];

	let selectedProject = $state(0);

	function selectProject(index: number) {
		selectedProject = index;
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				selectedProject = Math.max(0, selectedProject - 1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				selectedProject = Math.min(projects.length - 1, selectedProject + 1);
				break;
			case 'Enter':
				event.preventDefault();
				window.location.href = `/projects/${projects[selectedProject].slug}`;
				break;
			case 'F2':
				event.preventDefault();
				window.open(projects[selectedProject].repository, '_blank');
				break;
			case 'Escape':
				if (isSubRoute) {
					event.preventDefault();
					window.history.back();
				} else {
					event.preventDefault();
					window.location.href = '/';
				}
				break;
		}
	}
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap"
		rel="stylesheet"
	/>
	<link href="https://fonts.cdnfonts.com/css/ocr-a-bt" rel="stylesheet" />
</svelte:head>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="flex min-h-screen {isSubRoute
		? 'flex-row'
		: 'flex-col'} justify-center overflow-hidden bg-black font-mono text-green-400"
	onkeydown={handleKeydown}
	tabindex="0"
	role="application"
>
	<div
		class="crt terminal-container project-manager relative flex min-h-screen justify-center bg-fixed p-4 {isSubRoute
			? 'w-1/2 transform transition-all duration-700 ease-out'
			: 'w-full'}"
	>
		<div class="relative w-full max-w-4xl">
			<div
				class="terminal-screen relative overflow-hidden rounded border-2 border-green-400 bg-black p-4 shadow-lg shadow-green-400/50 md:p-5"
			>
				<div class="mb-6 text-center">
					<pre class="text-xs text-green-400">{`
╔══════════════════════════════════════════════════════════════════╗
║                        PROJECT MANAGER v0.1                      ║
║                           By phillychi3                          ║
╚══════════════════════════════════════════════════════════════════╝
					`}</pre>
				</div>

				<div
					class="my-5 flex min-h-[500px] transform flex-col border-2 border-green-400 bg-black transition-all duration-300 ease-in-out"
				>
					<div class="flex justify-between bg-green-400 px-2 py-1 text-xs font-bold text-black">
						<div class="flex gap-0">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<span
								class="transform cursor-pointer px-2 py-0.5 transition-all duration-150 ease-in-out hover:scale-105 hover:bg-white hover:text-black"
								onclick={() => (window.location.href = '/')}>Exit</span
							>
							<span
								class="transform cursor-pointer px-2 py-0.5 transition-all duration-150 ease-in-out hover:scale-105 hover:bg-white hover:text-black"
								>Edit</span
							>
							<span
								class="transform cursor-pointer px-2 py-0.5 transition-all duration-150 ease-in-out hover:scale-105 hover:bg-white hover:text-black"
								>Help</span
							>
						</div>
					</div>

					<div class="flex flex-1 bg-black">
						<div class="flex w-2/5 min-w-48 flex-col border-r border-gray-600">
							<div class="border-b border-gray-600 bg-gray-900 px-2 py-1.5 text-xs text-green-400">
								<span class="tui-panel-title">┌─ Projects ─┐</span>
							</div>
							<div class="flex-1 overflow-y-auto p-2">
								{#each projects as project, index}
									<div
										class="mb-0.5 flex cursor-pointer items-center border border-transparent px-2 py-1 text-xs transition-all duration-200 ease-in-out {index ===
										selectedProject
											? 'scale-105 border-green-400 bg-green-400 text-black shadow-sm'
											: 'text-gray-300 hover:scale-102 hover:border-gray-600 hover:bg-gray-800'} transform"
										onclick={() => selectProject(index)}
										ondblclick={() => (window.location.href = `/projects/${project.slug}`)}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												selectProject(index);
												if (e.shiftKey) {
													window.location.href = `/projects/${project.slug}`;
												}
											}
										}}
										role="button"
										tabindex="0"
									>
										<span class="mr-2 flex items-center">
											<Icon icon={project.icon} width="12" height="12" />
										</span>
										<span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
											>{project.name}</span
										>
									</div>
								{/each}
							</div>
						</div>

						<div class="flex flex-1 flex-col">
							<div class="border-b border-gray-600 bg-gray-900 px-2 py-1.5 text-xs text-green-400">
								<span class="tui-panel-title">┌─ Project Info ─┐</span>
							</div>
							<div class="flex-1 overflow-y-auto p-2">
								<div class="text-xs leading-relaxed text-gray-300">
									<div class="mb-3 flex flex-wrap">
										<span class="mr-2 min-w-16 font-bold text-cyan-400">Name:</span>
										<span class="flex-1 text-white">{projects[selectedProject].name}</span>
									</div>
									<div class="mb-3 flex flex-wrap">
										<span class="mr-2 min-w-16 font-bold text-cyan-400">Desc:</span>
										<span class="flex-1 text-white">{projects[selectedProject].description}</span>
									</div>
									<div class="mb-3 flex flex-wrap">
										<span class="mr-2 min-w-16 font-bold text-cyan-400">Repo:</span>
										<a
											href={projects[selectedProject].repository}
											target="_blank"
											class="cursor-pointer break-all text-green-400 underline hover:bg-green-400 hover:text-white"
										>
											{projects[selectedProject].repository}
										</a>
									</div>
									<div class="my-4 font-mono text-gray-600">─────────────────────</div>
									<div class="mt-4 space-y-2">
										<a
											href={projects[selectedProject].repository}
											target="_blank"
											class="mr-2 inline-block transform cursor-pointer border border-green-400 bg-gray-900 px-3 py-1.5 text-xs text-green-400 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-green-400 hover:text-black"
										>
											[F2] Open Repository
										</a>
										<a
											href="/projects/{projects[selectedProject].slug}"
											class="inline-block transform cursor-pointer border border-cyan-400 bg-gray-900 px-3 py-1.5 text-xs text-cyan-400 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-400 hover:text-black"
										>
											[Enter] View Details
										</a>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="flex justify-between bg-green-400 px-2 py-1 text-xs font-bold text-black">
						<div class=""></div>
						<div class="flex gap-3">
							<span>Projects: {projects.length}/4</span>
						</div>
					</div>
				</div>

				<div class="mt-8 border-t border-gray-700 pt-4 text-center">
					<div class="bg-black/30">
						<div class="flex items-center justify-between text-xs">
							<div></div>
							<div class="text-gray-400">© 2025 whitecloud</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if isSubRoute}
		<div
			class="sub-page-container animate-in slide-in-from-right-10 max-h-screen min-h-screen w-1/2 transform overflow-y-scroll border-l-2 border-green-400 bg-black p-4 transition-all duration-700 ease-out"
		>
			{@render children()}
		</div>
	{:else}
		{@render children()}
	{/if}
</div>

<style>
	@import url('https://fontsapi.zeoseven.com/442/main/result.css');
	:global(body) {
		margin: 0;
		padding: 0;
		background: #000000;
		font-family: 'OCR-A BT', 'Maple Mono NF CN', monospace;
		font-weight: normal;
		overflow-x: hidden;
		cursor: crosshair;
	}

	.tui-panel-title {
		color: #00ff96;
		text-shadow: 0 0 5px #00ff96;
	}

	.crt:focus {
		outline: none;
	}

	.project-manager {
		transform-origin: left center;
		will-change: transform, width;
	}

	.sub-page-container {
		will-change: transform, opacity;
		animation: slideInFromRight 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		border-left: 2px solid #00ff96;
	}

	@keyframes slideInFromRight {
		0% {
			transform: translateX(100%) scale(0.95);
			opacity: 0;
		}
		50% {
			transform: translateX(20%) scale(0.98);
			opacity: 0.8;
		}
		100% {
			transform: translateX(0) scale(1);
			opacity: 1;
		}
	}

	.terminal-container {
		cursor:
			url("data:image/svg+xml,%3csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3e%3ctext y='12' style='font: 12px monospace; fill: %2300ff96;'%3e█%3c/text%3e%3c/svg%3e"),
			crosshair;
	}

	.crt::after {
		content: ' ';
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(18, 16, 16, 0.1);
		opacity: 0;
		z-index: 9999;
		pointer-events: none;
		animation: flicker 0.15s infinite;
	}
	.crt::before {
		content: ' ';
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background:
			linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
			linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
		z-index: 9998;
		background-size:
			100% 2px,
			3px 100%;
		pointer-events: none;
	}
	.crt {
		position: relative;
	}

	@keyframes flicker {
		0% {
			opacity: 0.27861;
		}
		5% {
			opacity: 0.34769;
		}
		10% {
			opacity: 0.23604;
		}
		15% {
			opacity: 0.90626;
		}
		20% {
			opacity: 0.18128;
		}
		25% {
			opacity: 0.83891;
		}
		30% {
			opacity: 0.65583;
		}
		35% {
			opacity: 0.67807;
		}
		40% {
			opacity: 0.26559;
		}
		45% {
			opacity: 0.84693;
		}
		50% {
			opacity: 0.96019;
		}
		55% {
			opacity: 0.08594;
		}
		60% {
			opacity: 0.20313;
		}
		65% {
			opacity: 0.71988;
		}
		70% {
			opacity: 0.53455;
		}
		75% {
			opacity: 0.37288;
		}
		80% {
			opacity: 0.71428;
		}
		85% {
			opacity: 0.70419;
		}
		90% {
			opacity: 0.7003;
		}
		95% {
			opacity: 0.36108;
		}
		100% {
			opacity: 0.24387;
		}
	}

	::selection {
		background: rgba(0, 255, 150, 0.3);
		color: #ffffff;
	}
</style>
