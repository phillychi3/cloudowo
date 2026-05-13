<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="relative h-full overflow-hidden p-6 font-mono text-sm text-white/90">
	<div
		class="scrollbar-thin scrollbar-track-black scrollbar-thumb-green-500 h-full space-y-6 overflow-y-auto"
	>
		<header class="border-b border-green-500 pb-4">
			<h1 class="mb-2 text-2xl font-bold">{data.project.name}</h1>
			{#if data.project.description}
				<p class="text-sm">{data.project.description}</p>
			{/if}
			<div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
				{#if data.project.language}
					<span>● {data.project.language}</span>
				{/if}
				<span>★ {data.project.stars}</span>
				<a
					href={data.project.repository}
					target="_blank"
					class="text-green-400 underline hover:text-green-300"
				>
					{data.project.owner}/{data.project.repoName}
				</a>
			</div>
		</header>

		<section class="readme">
			{#if data.readmeHtml}
				{@html data.readmeHtml}
			{:else}
				<p class="text-yellow-400">[!] No README available.</p>
			{/if}
		</section>
	</div>
</div>

<style>
	.readme :global(h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 1.25rem 0 0.75rem;
		border-bottom: 1px solid rgba(34, 197, 94, 0.4);
		padding-bottom: 0.25rem;
	}
	.readme :global(h2) {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 1rem 0 0.5rem;
	}
	.readme :global(h3) {
		font-size: 1.05rem;
		font-weight: 700;
		margin: 0.75rem 0 0.4rem;
	}
	.readme :global(p) {
		margin: 0.5rem 0;
		line-height: 1.6;
	}
	.readme :global(a) {
		color: #4ade80;
		text-decoration: underline;
	}
	.readme :global(a:hover) {
		color: #86efac;
	}
	.readme :global(ul),
	.readme :global(ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}
	.readme :global(ul) {
		list-style: disc;
	}
	.readme :global(ol) {
		list-style: decimal;
	}
	.readme :global(li) {
		margin: 0.2rem 0;
	}
	.readme :global(code) {
		background: rgba(34, 197, 94, 0.12);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		font-size: 0.85rem;
	}
	.readme :global(pre) {
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(34, 197, 94, 0.3);
		padding: 0.75rem;
		border-radius: 4px;
		overflow-x: auto;
		margin: 0.75rem 0;
	}
	.readme :global(pre code) {
		background: transparent;
		padding: 0;
	}
	.readme :global(blockquote) {
		border-left: 3px solid #22c55e;
		padding-left: 0.75rem;
		color: #cbd5e1;
		margin: 0.5rem 0;
	}
	.readme :global(img) {
		max-width: 100%;
		height: auto;
	}
	.readme :global(table) {
		border-collapse: collapse;
		margin: 0.5rem 0;
	}
	.readme :global(th),
	.readme :global(td) {
		border: 1px solid rgba(34, 197, 94, 0.4);
		padding: 0.25rem 0.5rem;
	}
	.readme :global(hr) {
		border: none;
		border-top: 1px solid rgba(34, 197, 94, 0.3);
		margin: 1rem 0;
	}
</style>
