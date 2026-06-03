<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { SplitText } from 'gsap/SplitText';

	gsap.registerPlugin(ScrollTrigger, SplitText);

	let page: HTMLElement;
	let isBooting = true;

	const pageTitle = 'WhiteCloud Linktree';
	const pageDescription = 'Find My social links';
	const canonicalUrl = 'https://cloudowo.com/link/star';
	const socialImage = 'https://avatars.githubusercontent.com/u/55632143?v=4';

	const links = [
		{
			title: 'X',
			url: 'https://x.com/whitecloud_kig',
			icon: 'codicon:twitter',
			code: 'X-306',
			status: 'Active'
		},
		{
			title: 'Instagram',
			url: 'https://instagram.com/whitecloud_kig',
			icon: 'carbon:logo-instagram',
			code: 'INS-135',
			status: 'Active'
		},
		{
			title: 'Facebook',
			url: 'https://www.facebook.com/bai.yun.610145/',
			icon: 'carbon:logo-facebook',
			code: 'FB-128',
			status: 'Active'
		}
	];

	const photos = [
		{
			title: 'A moment of silence.',
			place: 'Taiwan',
			src: 'https://s3.cloudowo.com/manual/GuY5fI2bwAA1hE3.jpg',
			alt: 'Photo',
			code: '1938401902951014622'
		}
	];

	onMount(() => {
		let mounted = true;
		let cleanup = () => {};

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const bootTimer = window.setTimeout(
			() => {
				isBooting = false;
			},
			prefersReducedMotion ? 80 : 720
		);

		if (!page) return;

		gsap.defaults({ duration: 0.78, ease: 'power3.out' });

		const mm = gsap.matchMedia();

		mm.add(
			{
				reduceMotion: '(prefers-reduced-motion: reduce)',
				noReduceMotion: '(prefers-reduced-motion: no-preference)'
			},
			(context) => {
				if (!mounted || !page) return;

				const { reduceMotion } = context.conditions as {
					reduceMotion: boolean;
					noReduceMotion: boolean;
				};

				const refresh = () => ScrollTrigger.refresh();
				const images = Array.from(page.querySelectorAll<HTMLImageElement>('img'));
				const splitTexts: SplitText[] = [];

				images.forEach((image) => {
					if (!image.complete) {
						image.addEventListener('load', refresh, { once: true });
					}
				});

				if (reduceMotion) {
					gsap.set('.motion-item, .link-card, .photo-card', {
						y: 0,
						scale: 1,
						clearProps: 'transform'
					});

					requestAnimationFrame(refresh);

					return () => {
						images.forEach((image) => image.removeEventListener('load', refresh));
						splitTexts.forEach((split) => split.revert());
					};
				}

				gsap.from('.motion-item', {
					y: 18,
					stagger: 0.08,
					delay: 0.12,
					overwrite: true,
					clearProps: 'transform'
				});

				const codeScrambleIntervals: number[] = [];

				const revealCode = (el: HTMLElement, delay = 40) => {
					const finalText = el.dataset.code || '';
					if (!finalText) return;

					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
					const originalChars = finalText.split('');
					let iterations = 0;
					const total = originalChars.length;
					const maxIterations = 12;

					const interval = window.setInterval(() => {
						let result = '';

						for (let j = 0; j < total; j++) {
							if (j < iterations * (total / maxIterations)) {
								result += originalChars[j];
							} else if (originalChars[j] === ' ') {
								result += ' ';
							} else {
								result += chars.charAt(Math.floor(Math.random() * chars.length));
							}
						}

						el.textContent = result;
						iterations++;

						if (iterations > maxIterations) {
							window.clearInterval(interval);
							el.textContent = finalText;
						}
					}, delay);
				};

				document.querySelectorAll<HTMLElement>('.card-index').forEach((el, i) => {
					const finalText = el.dataset.code || '';
					if (!finalText) return;

					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

					codeScrambleIntervals[i] = window.setInterval(
						() => {
							el.textContent = finalText
								.split('')
								.map((char) => {
									if (char === ' ') return ' ';
									return chars.charAt(Math.floor(Math.random() * chars.length));
								})
								.join('');
						},
						40 + i * 15
					);
				});

				gsap.from('.link-card', {
					y: 28,
					stagger: { each: 0.07, from: 'start' },
					delay: 0.28,
					overwrite: true,
					clearProps: 'transform',
					onComplete: () => {
						document.querySelectorAll<HTMLElement>('.card-index').forEach((el, i) => {
							window.clearInterval(codeScrambleIntervals[i]);
							revealCode(el, 40 + i * 15);
						});
					}
				});

				gsap.set('.photo-card', { y: 42, scale: 0.985 });
				document.fonts.ready.then(() => {
					if (!mounted || !page) return;

					const containers = gsap.utils.toArray<HTMLElement>('.split-container');

					containers.forEach((container) => {
						const text = container.querySelector<HTMLElement>('.split');

						if (!text) return;

						gsap.set(text, { opacity: 1 });

						SplitText.create(text, {
							type: 'words,lines',
							mask: 'lines',
							linesClass: 'line',
							autoSplit: true,
							onSplit: (instance) => {
								return gsap.from(instance.lines, {
									yPercent: 120,
									stagger: 0.1,
									scrollTrigger: {
										trigger: container,
										scrub: true,
										start: 'clamp(top 75%)',
										end: 'clamp(bottom 35%)'
									}
								});
							}
						});
					});
				});
				ScrollTrigger.batch('.photo-card', {
					start: 'top 82%',
					once: true,
					onEnter: (cards) => {
						gsap.to(cards, {
							y: 0,
							scale: 1,
							stagger: 0.12,
							overwrite: true
						});

						cards.forEach((card) => {
							const title = card.querySelector<HTMLElement>('.photo-title');

							if (!title || title.dataset.splitReady === 'true') return;

							title.dataset.splitReady = 'true';

							const split = new SplitText(title, {
								type: 'chars, words',
								charsClass: 'split-char'
							});

							splitTexts.push(split);

							gsap.from(split.chars, {
								yPercent: 115,
								opacity: 0,
								rotateX: -70,
								transformOrigin: '50% 100%',
								stagger: 0.025,
								duration: 0.72,
								ease: 'back.out(1.7)'
							});
						});
					}
				});

				gsap.utils.toArray<HTMLElement>('.photo-card').forEach((card) => {
					const image = card.querySelector('img');

					if (!image) return;

					gsap.fromTo(
						image,
						{ yPercent: -7, scale: 1.08 },
						{
							yPercent: 7,
							scale: 1.08,
							ease: 'none',
							scrollTrigger: {
								trigger: card,
								start: 'top bottom',
								end: 'bottom top',
								scrub: 0.85
							}
						}
					);
				});

				requestAnimationFrame(refresh);

				return () => {
					images.forEach((image) => image.removeEventListener('load', refresh));
					splitTexts.forEach((split) => split.revert());
				};
			},
			page
		);

		cleanup = () => mm.revert();

		return () => {
			mounted = false;
			window.clearTimeout(bootTimer);
			cleanup();
		};
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Cloudowo" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={socialImage} />
	<meta property="og:image:alt" content="WhiteCloud photo showcase preview" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@whitecloud_kig" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	<meta name="twitter:image" content={socialImage} />
</svelte:head>

<main bind:this={page} class="star-page relative min-h-screen overflow-x-hidden text-[var(--ink)]">
	{#if isBooting}
		<div
			class="boot-screen fixed inset-0 z-20 grid place-items-center p-6"
			aria-label="Loading WhiteCloud links"
		>
			<div
				class="boot-panel relative box-border w-[min(520px,calc(100vw_-_32px))] rounded-[2px] border border-[rgba(244,247,242,0.2)] bg-[rgba(9,12,13,0.96)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)]"
			>
				<div
					class="boot-topline flex justify-between gap-4 font-mono text-xs font-extrabold tracking-normal text-[var(--med)] uppercase"
				>
					<span>PHARMACORE NODE</span>
					<span>WCL-033</span>
				</div>
				<div class="boot-mark grid min-h-[104px] place-items-center" aria-hidden="true">
					<div class="biohazard-symbol"></div>
				</div>
				<div class="boot-readout">
					<p
						class="m-0 font-mono text-xs font-extrabold tracking-normal text-[var(--muted)] uppercase"
					>
						STERILE LINK TERMINAL
					</p>
					<h2
						class="m-0 text-[4.5rem] leading-[0.9] font-black text-[var(--ink)] max-[640px]:text-[3.25rem]"
					>
						Whitecloud
					</h2>
				</div>
				<div
					class="boot-progress my-6 mb-4 h-1 overflow-hidden border border-[rgba(244,247,242,0.28)] bg-white/5"
					aria-hidden="true"
				>
					<span class="block h-full w-full origin-left"></span>
				</div>
				<div class="barcode h-8 opacity-[0.42]" aria-hidden="true"></div>
			</div>
		</div>
	{/if}

	<div
		class="pointer-events-none fixed inset-[18px] z-[1] border border-[rgba(244,247,242,0.045)]"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none fixed top-0 bottom-0 left-0 z-[1] w-px bg-[rgba(217,244,58,0.42)] opacity-50 max-[900px]:hidden"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none fixed top-0 right-0 bottom-0 z-[1] w-px bg-[rgba(217,244,58,0.42)] opacity-50 max-[900px]:hidden"
		aria-hidden="true"
	></div>

	<section
		class="hero-shell relative z-[2] mx-auto grid min-h-screen w-[calc(100%_-_32px)] max-w-[1180px] content-start gap-[26px] pt-7 pb-14 max-[640px]:w-[calc(100%_-_44px)] max-[640px]:pt-[18px]"
	>
		<div
			class="profile-chip motion-item grid w-fit max-w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border border-[var(--line)] bg-[rgba(232,238,225,0.92)] p-2.5 text-[#050607] [border-left:3px_solid_var(--med)]"
		>
			<img
				src="https://avatars.githubusercontent.com/u/55632143?v=4"
				alt="WhiteCloud avatar"
				class="size-[54px] border border-[#050607] object-cover contrast-[1.08] grayscale"
			/>
			<div class="min-w-0">
				<p class="m-0 text-[15px] leading-none font-black">maintainer</p>
				<span class="mt-[5px] block text-[13px] leading-tight text-[rgba(5,6,7,0.68)]"
					>sleep / dream / eat</span
				>
			</div>
		</div>

		<div class="grid">
			<div class="grid min-w-0 gap-3.5">
				<div
					class="system-strip motion-item flex w-fit flex-wrap gap-1.5 font-mono text-[11px] font-black tracking-normal text-[var(--muted)] uppercase max-[640px]:text-[10px]"
				>
					<span
						class="border border-[rgba(244,247,242,0.16)] bg-[rgba(244,247,242,0.035)] px-[9px] py-1.5"
					>
						RH-0 / PERSONAL TERMINAL
					</span>
					<span class="border border-[rgba(62,230,208,0.42)] px-[9px] py-1.5 text-[var(--med)]">
						ACCESS ONLINE
					</span>
				</div>
				<h1
					class="motion-item m-0 max-w-full text-[5.65rem] leading-[0.78] font-black tracking-normal uppercase max-[900px]:text-[4.7rem] max-[640px]:text-[2.95rem] max-[360px]:text-[2.45rem]"
				>
					WhiteCloud
				</h1>
				<p
					class="hero-text motion-item m-0 max-w-[640px] text-[1.2rem] leading-[1.55] text-[var(--muted)] max-[640px]:max-w-[34ch] max-[640px]:text-base"
				>
					Is a kiger <br />and also half a photographer
				</p>
			</div>
		</div>

		<div class="link-grid grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
			{#each links as link (link.title)}
				<a
					class="link-card relative grid min-h-[184px] grid-rows-[auto_1fr_auto] gap-4 overflow-hidden rounded-[2px] border border-[rgba(244,247,242,0.14)] bg-[rgba(12,15,16,0.94)] p-4 text-[var(--ink)] no-underline transition duration-200 hover:-translate-y-[5px] hover:border-[rgba(62,230,208,0.48)] hover:bg-[rgba(17,20,21,0.98)] focus-visible:-translate-y-[5px] focus-visible:border-[rgba(62,230,208,0.48)] focus-visible:bg-[rgba(17,20,21,0.98)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hazard)] max-[640px]:min-h-[178px]"
					href={link.url}
					target={link.url.startsWith('http') ? '_blank' : undefined}
					rel={link.url.startsWith('http') ? 'noreferrer' : undefined}
				>
					<span
						class="card-index w-fit border border-[rgba(62,230,208,0.58)] bg-[rgba(62,230,208,0.06)] px-[7px] py-[5px] font-mono text-[11px] font-black tracking-normal text-[var(--med)] uppercase"
						data-code={link.code}
					>
						{link.code}
					</span>
					<span
						class="card-icon absolute top-[42px] right-4 grid size-[42px] place-items-center border border-[rgba(244,247,242,0.18)] text-[var(--med)]"
						aria-hidden="true"
					>
						<Icon icon={link.icon} class="size-6" />
					</span>
					<span class="card-copy grid max-w-[calc(100%_-_66px)] gap-2.5 self-end">
						<h3
							class="card-title m-0 text-[2.05rem] leading-[0.92] font-black text-[var(--ink)] max-[640px]:text-[2rem]"
							data-title={link.title}
						>
							{link.title}
						</h3>
					</span>
					<span
						class="card-footer flex items-center justify-between gap-2.5 border-t border-[rgba(244,247,242,0.14)] pt-3 font-mono text-[11px] font-black tracking-normal text-[var(--med)] uppercase"
					>
						<span>{link.status}</span>
						<Icon icon="lucide:arrow-up-right" class="size-[18px]" aria-hidden="true" />
					</span>
					<span
						class="card-barcode absolute top-3.5 right-3.5 h-3 w-[74px] opacity-[0.22]"
						aria-hidden="true"
					></span>
				</a>
			{/each}
		</div>
	</section>

	<section
		class="photo-section relative z-[2] mx-auto w-[calc(100%_-_32px)] max-w-[1180px] pt-[70px] pb-[90px] max-[640px]:w-[calc(100%_-_44px)] max-[640px]:pt-[42px]"
		aria-label="Photo showcase"
	>
		<div class="section-heading split-container mb-6 grid gap-2.5">
			<div class="split">
				<p class="m-0 font-mono text-xs font-black tracking-normal text-[var(--med)] uppercase">
					Observation Log
				</p>
				<h2
					class="m-0 max-w-[11ch] text-[4.8rem] leading-[0.78] font-black tracking-normal uppercase max-[640px]:text-[3rem]"
				>
					Photo Showcase
				</h2>
			</div>
			<div class="section-scanline h-px w-[min(100%,680px)]" aria-hidden="true"></div>
		</div>

		<div class="photo-stack grid gap-[18px]">
			{#each photos as photo, index (photo.title)}
				<article
					class="photo-card relative min-h-[72vh] overflow-hidden rounded-[2px] border border-[rgba(244,247,242,0.2)] bg-[#07090a] max-[640px]:min-h-[68vh]"
				>
					<div class="photo-frame absolute inset-0 overflow-hidden">
						<img
							src={photo.src}
							alt={photo.alt}
							loading={index === 0 ? 'eager' : 'lazy'}
							class="h-[86vh] min-h-[620px] w-full object-cover transition-[filter] duration-[260ms] ease-in-out max-[640px]:h-[76vh] max-[640px]:min-h-[520px]"
						/>
					</div>
					<div
						class="photo-overlay absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between gap-5 border-t border-[rgba(244,247,242,0.18)] bg-[rgba(5,6,7,0.72)] p-[22px] max-[640px]:grid max-[640px]:gap-3 max-[640px]:p-4"
					>
						<div>
							<p
								class="mt-0 mb-[9px] font-mono text-xs font-black tracking-normal text-[var(--med)] uppercase"
							>
								{String(index + 1).padStart(2, '0')} / {photo.code}
							</p>
							<h3
								class="photo-title m-0 text-[4rem] leading-[0.9] font-black text-[var(--ink)] max-[640px]:text-[2.4rem]"
							>
								{photo.title}
							</h3>
						</div>
						<span
							class="text-right font-mono text-xs font-black tracking-normal text-[var(--med)] uppercase max-[640px]:text-left"
						>
							{photo.place}
						</span>
					</div>
					<div
						class="absolute top-4 right-4 z-[3] h-0.5 w-[118px] bg-[rgba(62,230,208,0.72)]"
						aria-hidden="true"
					></div>
				</article>
			{/each}
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #050607;
	}

	.star-page {
		--ink: #f4f7f2;
		--muted: #9ba3a3;
		--line: rgba(244, 247, 242, 0.13);
		--hazard: #d9f43a;
		--med: #3ee6d0;
		background:
			linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px) 0 0 / 56px 56px,
			linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px) 0 0 / 56px 56px,
			linear-gradient(145deg, #070809 0%, #111415 52%, #070809 100%);
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.star-page::before {
		content: '';
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background:
			linear-gradient(transparent 0 49%, rgba(62, 230, 208, 0.035) 50%, transparent 51%),
			repeating-linear-gradient(90deg, transparent 0 27px, rgba(255, 255, 255, 0.018) 27px 28px);
		background-size:
			100% 14px,
			100% 100%;
		mix-blend-mode: screen;
		opacity: 0.28;
	}

	:global(.star-page ::selection) {
		background: var(--hazard);
		color: #050607;
	}

	.boot-screen {
		background:
			linear-gradient(135deg, rgba(62, 230, 208, 0.08), transparent 36%),
			linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 40px 40px,
			#050607;
		animation: boot-fade 0.28s ease 0.54s forwards;
	}

	.biohazard-symbol {
		position: relative;
		width: 54px;
		aspect-ratio: 1;
		border: 1px solid rgba(62, 230, 208, 0.76);
		border-radius: 2px;
		animation: none;
	}

	.biohazard-symbol::before {
		content: '';
		position: absolute;
		inset: 12px;
		border: 1px solid rgba(244, 247, 242, 0.58);
		border-radius: 50%;
	}

	.boot-progress span {
		background: linear-gradient(90deg, var(--med), var(--hazard));
		animation: boot-load 0.86s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
	}

	.barcode {
		background: repeating-linear-gradient(
			90deg,
			var(--ink) 0 2px,
			transparent 2px 5px,
			var(--ink) 5px 7px,
			transparent 7px 13px,
			var(--ink) 13px 14px,
			transparent 14px 19px
		);
	}

	.link-card::before {
		content: '';
		position: absolute;
		inset: 0 0 auto;
		height: 2px;
		background: rgba(62, 230, 208, 0.9);
	}

	.card-barcode {
		background: repeating-linear-gradient(
			90deg,
			rgba(244, 247, 242, 0.84) 0 1px,
			transparent 1px 4px,
			rgba(244, 247, 242, 0.84) 4px 6px,
			transparent 6px 10px
		);
	}

	.section-scanline {
		background: repeating-linear-gradient(
			90deg,
			rgba(62, 230, 208, 0.8) 0 80px,
			transparent 80px 96px,
			rgba(244, 247, 242, 0.2) 96px 160px,
			transparent 160px 176px
		);
	}

	.photo-frame::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		background:
			linear-gradient(90deg, rgba(5, 6, 7, 0.52), transparent 42% 72%, rgba(5, 6, 7, 0.48)),
			linear-gradient(180deg, transparent 52%, rgba(5, 6, 7, 0.86));
		pointer-events: none;
	}

	.photo-frame img {
		filter: grayscale(0.58) contrast(1.05) saturate(0.9);
	}

	.photo-card:hover .photo-frame img {
		filter: grayscale(0) contrast(1) saturate(1);
	}

	@keyframes boot-load {
		from {
			transform: scaleX(0.04);
		}
		to {
			transform: scaleX(1);
		}
	}

	@keyframes boot-fade {
		to {
			opacity: 0;
			visibility: hidden;
		}
	}

	@media (max-width: 640px) {
		.star-page {
			background:
				linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px) 0 0 / 28px 28px,
				linear-gradient(rgba(255, 255, 255, 0.024) 1px, transparent 1px) 0 0 / 28px 28px,
				linear-gradient(145deg, #050607 0%, #111516 52%, #050607 100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation-duration: 0.001ms !important;
			animation-iteration-count: 1 !important;
			scroll-behavior: auto !important;
			transition-duration: 0.001ms !important;
		}

		.boot-screen {
			animation-delay: 0.04s;
		}
	}

	.split {
		opacity: 0;
	}

	:global(.line) {
		overflow: hidden;
	}
</style>
