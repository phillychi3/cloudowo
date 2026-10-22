<script lang="ts" module>
	export type Tab = 'home' | 'projects' | 'blog' | 'friends';
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { era } from '$lib/era.svelte';

	type Post = { title: string; link: string; pubDate?: string };
	type Project = { name: string; description: string; url: string };
	type Friend = { name: string; url: string };
	type Banner = { image: string; link: string };

	let {
		tab = $bindable('home'),
		posts,
		projects,
		friends,
		banners
	}: {
		tab?: Tab;
		posts: Post[];
		projects: Project[];
		friends: Friend[];
		banners: Banner[];
	} = $props();

	const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
	const isoDate = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '----------');
	const shortHash = (s: string) => {
		let h = 0x811c9dc5;
		for (const c of s) h = Math.imul(h ^ c.codePointAt(0)!, 0x01000193);
		return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
	};

	type Entry = {
		id: number;
		cmd: string;
		out: 'help' | 'projects' | 'posts' | 'friends' | 'text';
		text?: string;
		tone?: 'err' | 'ok';
	};

	const COMMANDS: [string, string][] = [
		['help', '列出可用指令'],
		['ls', '列出作品'],
		['blog', '最新文章'],
		['friends', '朋友們'],
		['open <名稱>', '開啟作品或友站'],
		['clear', '清空畫面'],
		['rollback', '回到廢墟']
	];
	const NAMES = ['help', 'whoami', 'ls', 'blog', 'friends', 'open', 'date', 'clear', 'rollback'];

	let history = $state<Entry[]>([]);
	let input = $state('');
	let inputEl = $state<HTMLInputElement>();
	let body: HTMLDivElement;
	let nextId = 0;
	let past: string[] = [];
	let pastIdx = -1;

	function run(raw: string) {
		const cmd = raw.trim();
		const push = (e: Omit<Entry, 'id' | 'cmd'>) => history.push({ id: nextId++, cmd, ...e });
		if (!cmd) return push({ out: 'text', text: '' });
		past.unshift(cmd);
		pastIdx = -1;
		const [name, ...args] = cmd.split(/\s+/);
		switch (name) {
			case 'help':
				return push({ out: 'help' });
			case 'ls':
			case 'projects':
				return push({ out: 'projects' });
			case 'blog':
				return push({ out: 'posts' });
			case 'friends':
				return push({ out: 'friends' });
			case 'whoami':
				return push({ out: 'text', text: 'whitecloud' });
			case 'date':
				return push({ out: 'text', text: new Date().toLocaleString('zh-TW', { hour12: false }) });
			case 'clear':
				history = [];
				return;
			case 'open': {
				const q = args.join(' ').toLowerCase();
				const hit = q && [...projects, ...friends].find((p) => p.name.toLowerCase().includes(q));
				if (!hit) return push({ out: 'text', text: `open: 找不到「${args.join(' ')}」`, tone: 'err' });
				window.open(hit.url, '_blank', 'noopener');
				return push({ out: 'text', text: `opening ${hit.url}` });
			}
			case 'rollback':
			case 'exit':
				push({ out: 'text', text: 'rollback' });
				setTimeout(() => era.goBack(), 400);
				return;
			case 'sudo':
				return push({ out: 'text', text: 'sudo: permission denied', tone: 'err' });
			default:
				return push({ out: 'text', text: `zsh: command not found: ${name}`, tone: 'err' });
		}
	}

	async function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			run(input);
			input = '';
			await tick();
			body.scrollTop = body.scrollHeight;
		} else if (e.key === 'ArrowUp' && past.length) {
			e.preventDefault();
			pastIdx = Math.min(past.length - 1, pastIdx + 1);
			input = past[pastIdx];
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			pastIdx = Math.max(-1, pastIdx - 1);
			input = pastIdx < 0 ? '' : past[pastIdx];
		} else if (e.key === 'Tab') {
			e.preventDefault();
			const hit = NAMES.filter((n) => n.startsWith(input.trim()));
			if (hit.length === 1) input = hit[0] + ' ';
		} else if (e.key === 'l' && e.ctrlKey) {
			e.preventDefault();
			history = [];
		}
	}

	function focusPrompt(e: MouseEvent) {
		const t = e.target as HTMLElement;
		if (t.closest('a, button, input') || window.getSelection()?.toString()) return;
		inputEl?.focus({ preventScroll: true });
	}
</script>

{#snippet prompt(path: string, cmd: string)}
	<div class="prompt">
		<span class="user">whitecloud</span><span class="dim">@</span><span class="host">cloudowo</span>
		<span class="path">{path}</span>
		<span class="arrow">❯</span>
		<span>{cmd}</span>
	</div>
{/snippet}

{#snippet projectsOut()}
	<ul class="eza">
		{#each projects as p (p.url)}
			<li>
				<a href={p.url} target="_blank" rel="noopener">
					<span class="dir">{p.name}/</span>
					<span class="desc">{p.description}</span>
					<span class="url">{domain(p.url)}</span>
				</a>
			</li>
		{/each}
		<li>
			<a href="/projects">
				<span class="dir more">more/</span>
				<span class="desc">所有 GitHub 專案</span>
				<span class="url">/projects</span>
			</a>
		</li>
	</ul>
{/snippet}

{#snippet postsOut()}
	{#if posts.length === 0}
		<p class="dim">fetching origin…</p>
	{:else}
		<ul class="log">
			{#each posts as post, i (post.link + i)}
				<li>
					<a href={post.link} target="_blank" rel="noopener">
						<span class="hash">{shortHash(post.title)}</span>
						<span class="date">{isoDate(post.pubDate)}</span>
						<span class="title">{post.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#snippet friendsOut()}
	<ul class="links">
		{#each friends as f (f.url)}
			<li>
				<a href={f.url} target="_blank" rel="noopener">
					<span class="sym">{f.name}</span>
					<span class="dim">-&gt;</span>
					<span class="target">{domain(f.url)}</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="body" bind:this={body} onclick={focusPrompt}>
	{#if tab === 'home'}
		{@render prompt('~', 'fastfetch')}
		<div class="out fetch">
			<img src="https://avatars.githubusercontent.com/u/55632143?v=4" alt="WhiteCloud 的頭像" />
			<div class="info">
				<p><span class="user">whitecloud</span><span class="dim">@</span><span class="host">cloudowo</span></p>
				<p><span class="k">Host</span>白雲小鎮</p>
				<p><span class="k">Focus</span>網頁開發 · UI/UX · side projects</p>
				<p><span class="k">Motto</span>我們要好好活在今天</p>
			</div>
		</div>

		{#each history as e (e.id)}
			{@render prompt('~', e.cmd)}
			<div class="out">
				{#if e.out === 'help'}
					<dl class="help">
						{#each COMMANDS as [name, desc] (name)}
							<dt>{name}</dt>
							<dd>{desc}</dd>
						{/each}
					</dl>
				{:else if e.out === 'projects'}
					{@render projectsOut()}
				{:else if e.out === 'posts'}
					{@render postsOut()}
				{:else if e.out === 'friends'}
					{@render friendsOut()}
				{:else if e.text}
					<p class={e.tone}>{e.text}</p>
				{/if}
			</div>
		{/each}

		<label class="prompt live">
			<span class="user">whitecloud</span><span class="dim">@</span><span class="host">cloudowo</span>
			<span class="path">~</span>
			<span class="arrow">❯</span>
			<input
				bind:this={inputEl}
				bind:value={input}
				onkeydown={onKey}
				spellcheck="false"
				autocomplete="off"
				autocapitalize="off"
				aria-label="輸入指令，輸入 help 查看可用指令"
				placeholder="help"
			/>
		</label>
	{:else if tab === 'projects'}
		{@render prompt('~', 'eza ~/projects')}
		<div class="out">{@render projectsOut()}</div>
	{:else if tab === 'blog'}
		{@render prompt('~/blog', 'git log --oneline -5')}
		<div class="out">
			{@render postsOut()}
			<a class="remote" href="https://blog.cloudowo.com" target="_blank" rel="noopener">
				<span class="dim">remote:</span> blog.cloudowo.com
			</a>
		</div>
	{:else}
		{@render prompt('~', 'ls -l ~/friends')}
		<div class="out">{@render friendsOut()}</div>
		{@render prompt('~', 'chafa ~/webring/*.gif')}
		<div class="out banners">
			{#each banners as b (b.image)}
				<a href={b.link} target="_blank" rel="noopener noreferrer">
					<img src={b.image} alt="友站橫幅" width="88" height="31" />
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 14px 16px 16px;
		scrollbar-width: thin;
		scrollbar-color: #3a3346 transparent;
	}

	p,
	ul,
	dl {
		margin: 0;
	}

	ul {
		padding: 0;
		list-style: none;
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	.dim {
		color: var(--dim);
	}
	.ok {
		color: var(--mint);
	}
	.err {
		color: var(--red);
	}
	.user {
		color: var(--mint);
		font-weight: 700;
	}
	.host {
		color: var(--cyan);
		font-weight: 700;
	}
	.path {
		color: var(--blue);
	}
	.arrow {
		color: var(--mint);
	}

	.prompt {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 0.6ch;
		margin-top: 12px;
	}

	.prompt:first-child {
		margin-top: 0;
	}

	.out {
		margin-top: 6px;
	}

	.fetch {
		display: grid;
		grid-template-columns: 84px minmax(0, 1fr);
		gap: 16px;
		align-items: center;
	}

	.fetch img {
		width: 84px;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 6px;
	}

	.k {
		display: inline-block;
		width: 7ch;
		color: var(--mint);
		font-weight: 700;
	}

	.eza a,
	.log a {
		display: grid;
		column-gap: 1.6ch;
		padding: 1px 6px;
		margin: 0 -6px;
		border-radius: 4px;
	}

	.eza a {
		grid-template-columns: minmax(9ch, 13ch) minmax(0, 1fr) auto;
	}

	.eza a:hover {
		background: rgba(142, 230, 191, 0.08);
	}

	.dir {
		color: var(--blue);
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dir.more {
		color: var(--cyan);
	}

	.desc,
	.title {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.url,
	.date,
	.target {
		color: var(--dim);
	}

	.eza a:hover .url {
		color: var(--cyan);
	}

	.log a {
		grid-template-columns: 7ch 10ch minmax(0, 1fr);
	}

	.log a:hover {
		background: rgba(232, 199, 122, 0.08);
	}

	.hash {
		color: var(--yellow);
	}

	.log a:hover .title {
		color: var(--yellow);
	}

	.remote {
		display: inline-block;
		margin-top: 10px;
		color: var(--cyan);
	}

	.links a {
		display: inline-flex;
		gap: 1ch;
	}

	.sym {
		color: var(--cyan);
	}

	.links a:hover .sym {
		text-decoration: underline;
	}

	.banners {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.banners img {
		display: block;
		image-rendering: pixelated;
	}

	.help {
		display: grid;
		grid-template-columns: max-content 1fr;
		column-gap: 3ch;
	}

	.help dt {
		color: var(--mint);
	}

	.help dd {
		margin: 0;
		color: var(--dim);
	}

	.live {
		cursor: text;
	}

	.live input {
		flex: 1;
		min-width: 8ch;
		padding: 0;
		border: none;
		outline: none;
		background: none;
		color: var(--fg);
		font: inherit;
		caret-color: var(--mint);
	}

	.live input::placeholder {
		color: #4a4458;
	}

	@media (max-width: 560px) {
		.eza a {
			grid-template-columns: minmax(9ch, 12ch) minmax(0, 1fr);
		}

		.url,
		.hash {
			display: none;
		}

		.log a {
			grid-template-columns: 10ch minmax(0, 1fr);
		}
	}
</style>
