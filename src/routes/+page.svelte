<script lang="ts">
	import { onMount } from 'svelte';

	let currentTime = '';
	type Item = {
		title: string;
		link: string;
		pubDate?: string;
		contentSnippet?: string;
	};
	let feedItems: Item[] = [];

	async function fetchRSSFeed() {
		try {
			const parser = new RSSParser();
			const feed = await parser.parseURL('https://blog.cloudowo.com/atom');
			console.log(feed);
			feedItems = feed.items.slice(0, 5).map((item: { title: any; link: any; pubDate: any }) => ({
				title: item.title || 'Untitled',
				link: item.link || '#',
				pubDate: item.pubDate || ''
			}));
		} catch (err) {
			console.error('Error fetching RSS feed:', err);
			feedItems = [
				{
					title: 'Unable to load blog posts',
					link: 'https://blog.cloudowo.com',
					pubDate: ''
				}
			];
		}
	}

	onMount(() => {
		function updateTime() {
			const now = new Date();
			currentTime = now.toLocaleTimeString('zh-TW', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		}

		updateTime();
		const timeInterval = setInterval(updateTime, 1000);
		fetchRSSFeed();

		return () => {
			clearInterval(timeInterval);
		};
	});

	const Projects = [
		{
			name: 'Nothing Bot',
			description: '一個多功能 Discord 機器人，提供音樂播放、管理工具等功能。',
			url: 'https://nothing.cloudowo.com'
		},
		{
			name: 'RTPIC',
			description: '一個自用的返圖系統',
			url: 'https://rtpic.cloudowo.com'
		},
		{
			name: 'MYGO',
			description: 'mygo 圖片網',
			url: 'https://mygo.雲.tw'
		},
		{
			name: 'cloudinit',
			description: '起始頁',
			url: 'https://雲.tw'
		},
		{
			name: 'DDHelper',
			description: 'Vtuber 直播資訊網站',
			url: 'https://ddhelper.cloudowo.com'
		}
	];

	const Friends = [
		{
			name: '泉野咲',
			url: 'https://izumino.cat/'
		},
		{
			name: 'Plasmon222',
			url: 'https://blog.loveak.top/'
		},
		{
			name: 'IceWingsOvO',
			url: 'https://fringe-fuschia-93b.notion.site/IceWings-World-2d4862315252419ca84a69acd893d70b'
		}
	];
	const title = '白雲小鎮';
	const description = '我們要好好活在今天';
	const url = 'https://cloudowo.com';
</script>

<svelte:head>
	<!-- Life is a beautiful death -->
	<title>{title}</title>
	<meta charset="UTF-8" />
	<meta name="description" content={title} />
	<meta name="og:title" content={title} />
	<meta name="og:description" content={description} />
	<meta name="og:type" content="website" />
	<meta name="og:url" content={url} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
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
	<script src="https://cdn.jsdelivr.net/npm/rss-parser@3.13.0/dist/rss-parser.min.js"></script>
</svelte:head>

<div class="crt m-2 flex flex-col justify-center md:m-10 lg:flex-row">
	<div class="terminal-container pos-relative flex min-h-screen justify-center bg-fixed">
		<div class="pos-relative w-full max-w-4xl px-2 lg:w-[95%] lg:px-0">
			<div class="terminal-screen">
				<div class="terminal-header">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="neon-text text-sm md:text-base">WHITECLOUD</span>
						<span class="time-display text-xs md:text-sm">{currentTime}</span>
					</div>
				</div>
				<div class="about-section">
					<div class="about-content flex-col md:flex-row">
						<div class="terminal-box">
							<div class="terminal-box-header">
								<span class="file-name">whoami.txt</span>
								<span class="controls">- □ ×</span>
							</div>
							<div class="p-[15px]">
								<div class="code-line">
									<span class="prompt">$</span> cat about.txt
								</div>
								<div class="output-line">Hi! 我是 WhiteCloud，一個熱愛技術與創作的開發者。</div>
								<div class="output-line">
									專注於網頁開發、UI/UX 設計，以及各種有趣的 side projects。
								</div>
								<div class="code-line">
									<span class="prompt">$</span>
									<span class="cursor-blink">█</span>
								</div>
							</div>
						</div>
						<img
							src="https://avatars.githubusercontent.com/u/55632143?v=4"
							alt="Avatar"
							class="mx-auto mt-4 h-24 w-24 border-2 border-green-400 object-cover md:mx-0 md:mt-0 md:ml-6 md:h-30 md:w-30"
						/>
					</div>
				</div>
			</div>

			<div class="terminal-screen blog-section">
				<h2 class="neon-text text-xl md:text-2xl">BLOG</h2>
				<div class="blog-content">
					{#if feedItems.length === 0}
						<div class="loading-container">
							<div class="code-line">
								<span class="prompt">$</span>
								<span class="loading-text">Loading blog posts</span>
								<span class="cursor-blink">█</span>
							</div>
						</div>
					{:else}
						<div class="blog-list">
							{#each feedItems as item, index}
								<div class="blog-item">
									<div class="blog-item-header">
										<span class="blog-number neon-cyan">[{String(index + 1).padStart(2, '0')}]</span
										>
										<a href={item.link} target="_blank" class="blog-title">
											{item.title}
										</a>
									</div>
									{#if item.contentSnippet}
										<div class="blog-snippet">{item.contentSnippet}</div>
									{/if}
									{#if item.pubDate}
										<div class="blog-date">
											{new Date(item.pubDate).toLocaleDateString('zh-TW')}
										</div>
									{/if}
								</div>
							{/each}
						</div>
						<div class="blog-footer">
							<div class="code-line">
								<span class="prompt">$</span>
								<a href="https://blog.cloudowo.com" target="_blank" class="neon-cyan">
									cd blog.cloudowo.com
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="terminal-screen projects-section">
				<h2 class="neon-text text-xl md:text-2xl">PROJECTS</h2>
				<div class="flex flex-col gap-4">
					{#each Projects as project}
						<div class="project-item">
							<a
								class="neon-cyan cursor-pointer text-base hover:underline md:text-lg"
								href={project.url}
								target="_blank"
							>
								{project.name}
							</a>
							<p class="text-sm text-gray-300 md:text-base">
								{project.description}
							</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="status-bar">
				<div class="status-item">
					<span class="neon-green">ONLINE</span> │
					<span class="neon-yellow">READY</span> │
					<span class="neon-pink">TERMINAL MODE</span> │
					<span class="status-info">© 2025 whitecloud</span>
				</div>
			</div>
		</div>
	</div>
	<div class="mt-6 flex w-full flex-col space-y-6 lg:mt-0 lg:w-auto lg:min-w-[200px]">
		<div class="terminal-screen ml-0 lg:ml-4">
			<div class="">
				<h3 class="neon-cyan mb-3 text-sm font-bold md:text-base">Links</h3>
				<div class="space-y-2">
					<a
						href="https://blog.cloudowo.com"
						class="bg-opacity-30 hover:bg-opacity-50 block rounded bg-black p-2 text-sm text-gray-300 transition-all"
						target="_blank"
					>
						<p>Blog</p>
					</a>
					<a
						href="/projects"
						class="bg-opacity-30 hover:bg-opacity-50 block rounded bg-black p-2 text-sm text-gray-300 transition-all"
					>
						<p>Projects</p>
					</a>
				</div>
			</div>
		</div>
		<div class="terminal-screen ml-0 lg:ml-4">
			<div class="">
				<h3 class="neon-cyan mb-3 text-sm font-bold md:text-base">Friends</h3>
				<div class="space-y-2">
					{#each Friends as friend}
						<a
							href={friend.url}
							class="bg-opacity-30 hover:bg-opacity-50 block rounded bg-black text-sm text-gray-300 transition-all"
							target="_blank"
						>
							<p>{friend.name}</p>
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
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

	.terminal-screen {
		background: #000000;
		border: 2px solid #00ff96;
		border-radius: 4px;
		padding: 15px;
		box-shadow:
			0 0 20px rgba(0, 255, 150, 0.5),
			inset 0 0 30px rgba(0, 255, 150, 0.1);
		position: relative;
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.terminal-screen {
			padding: 20px;
		}
	}

	.terminal-header {
		border-bottom: 1px solid #00ff96;
		padding-bottom: 10px;
		margin-bottom: 20px;
	}

	.blog-section {
		margin-top: 30px;
	}

	.projects-section {
		margin-top: 30px;
	}

	.time-display {
		color: #ff006e;
		text-shadow: 0 0 10px #ff006e;

		font-size: 14px;
	}

	.neon-text {
		color: #00ff96;
		text-shadow:
			0 0 5px #00ff96,
			0 0 10px #00ff96;

		animation: neon-pulse 2s ease-in-out infinite alternate;
	}

	.neon-cyan {
		color: #00d9ff;
		text-shadow:
			0 0 5px #00d9ff,
			0 0 10px #00d9ff,
			0 0 15px #00d9ff;
	}

	.neon-green {
		color: #39ff14;
		text-shadow:
			0 0 5px #39ff14,
			0 0 10px #39ff14;
	}

	.neon-yellow {
		color: #ffff00;
		text-shadow:
			0 0 5px #ffff00,
			0 0 10px #ffff00;
	}

	.neon-pink {
		color: #ff1493;
		text-shadow:
			0 0 5px #ff1493,
			0 0 10px #ff1493;
	}

	.about-section {
		margin: 30px 0;
	}

	.about-content {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		gap: 16px;
	}

	@media (min-width: 768px) {
		.about-content {
			flex-direction: row;
			gap: 24px;
		}
	}

	.terminal-box {
		background: #111;
		border: 1px solid #333;
		border-radius: 5px;
		max-width: 600px;
		width: 100%;
	}

	.terminal-box-header {
		background: #222;
		padding: 6px 12px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #333;
	}

	@media (min-width: 768px) {
		.terminal-box-header {
			padding: 8px 15px;
		}
	}

	.file-name {
		color: #00ff96;
		text-shadow: 0 0 3px #00ff96;
		font-size: 12px;
	}

	.controls {
		color: #666;
		font-size: 12px;
	}

	.code-line {
		margin: 8px 0;
		font-size: 13px;
		color: #00d9ff;
		text-shadow: 0 0 3px #00d9ff;
	}

	.output-line {
		margin: 8px 0;
		margin-left: 20px;
		font-size: 13px;
		color: #ccc;
		font-family: 'Noto Sans Mono', monospace;
		font-optical-sizing: auto;
		font-style: normal;
		font-variation-settings: 'wdth' 100;
	}

	.prompt {
		color: #00ff96;
		text-shadow: 0 0 3px #00ff96;
	}

	.cursor-blink {
		color: #00ff96;
		text-shadow: 0 0 5px #00ff96;
		animation: blink-cursor 1s infinite;
	}

	.status-item {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid #333;
		border-radius: 4px;
		padding: 15px;
		text-align: center;
	}

	.status-bar {
		border-top: 1px solid #333;
		padding-top: 15px;
		text-align: center;
		margin-top: 30px;
	}

	.status-bar .status-item {
		background: none;
		border: none;
		padding: 0;
		font-size: 12px;
		color: #666;
	}

	.status-info {
		color: #888;
	}

	.blog-content {
		margin-top: 20px;
	}

	.loading-container {
		display: flex;
		justify-content: center;
		padding: 20px;
	}

	.loading-text {
		color: #00d9ff;
		text-shadow: 0 0 3px #00d9ff;
	}

	.blog-list {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.blog-item {
		background: #111;
		border: 1px solid #333;
		border-radius: 5px;
		padding: 15px;
		transition: all 0.3s ease;
	}

	.blog-item:hover {
		border-color: #00ff96;
		box-shadow: 0 0 10px rgba(0, 255, 150, 0.2);
	}

	.blog-item-header {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin-bottom: 8px;
		flex-direction: column;
	}

	@media (min-width: 640px) {
		.blog-item-header {
			flex-direction: row;
			gap: 10px;
		}
	}

	.blog-number {
		font-size: 11px;
		flex-shrink: 0;
	}

	@media (min-width: 768px) {
		.blog-number {
			font-size: 12px;
		}
	}

	.blog-title {
		color: #00ff96;
		text-decoration: none;
		font-size: 13px;
		line-height: 1.4;
		transition: all 0.3s ease;
	}

	@media (min-width: 768px) {
		.blog-title {
			font-size: 14px;
		}
	}

	.blog-title:hover {
		text-shadow:
			0 0 5px #00ff96,
			0 0 10px #00ff96;
		color: #39ff14;
	}

	.blog-snippet {
		color: #ccc;
		font-size: 11px;
		line-height: 1.4;
		margin-left: 0;
		margin-bottom: 5px;
		font-family: 'Noto Sans Mono', monospace;
	}

	@media (min-width: 640px) {
		.blog-snippet {
			margin-left: 30px;
			font-size: 12px;
		}
	}

	.blog-date {
		color: #666;
		font-size: 11px;
		text-align: right;
	}

	.blog-footer {
		margin-top: 20px;
		padding-top: 15px;
		border-top: 1px solid #333;
	}

	.blog-footer .neon-cyan {
		text-decoration: none;
		transition: all 0.3s ease;
	}

	@keyframes neon-pulse {
		from {
			text-shadow:
				0 0 5px #00ff96,
				0 0 10px #00ff96,
				0 0 15px #00ff96,
				0 0 20px #00ff96;
		}
		to {
			text-shadow:
				0 0 2px #00ff96,
				0 0 5px #00ff96,
				0 0 8px #00ff96,
				0 0 12px #00ff96;
		}
	}

	@keyframes blink-cursor {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0;
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

	@media (max-width: 767px) {
		.neon-text {
			font-size: 14px;
		}

		.time-display {
			font-size: 12px;
		}

		.terminal-header {
			padding-bottom: 8px;
			margin-bottom: 15px;
		}

		.blog-section,
		.projects-section {
			margin-top: 20px;
		}

		.code-line {
			font-size: 12px;
		}

		.output-line {
			font-size: 12px;
			margin-left: 15px;
		}

		.status-bar {
			margin-top: 20px;
		}

		.status-bar .status-item {
			font-size: 10px;
		}

		.crt::before {
			opacity: 0.3;
		}

		.crt::after {
			opacity: 0.1;
		}

		.file-name {
			font-size: 11px;
		}

		.controls {
			font-size: 11px;
		}

		.blog-item,
		.project-item {
			padding: 12px;
		}

		.blog-title,
		.neon-cyan {
			touch-action: manipulation;
		}

		a {
			min-height: 44px;
			display: flex;
			align-items: center;
		}
	}

	@media (min-width: 768px) and (max-width: 1023px) {
		.terminal-screen {
			padding: 18px;
		}

		.about-content {
			gap: 20px;
		}
	}

	@media (min-width: 1024px) {
		.terminal-container {
			padding: 0 20px;
		}
	}
</style>
