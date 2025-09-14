<script lang="ts">
	import type { PageProps } from './$types';
	import { Github } from 'svelte-github-card';

	let { data }: PageProps = $props();

	let projects = [
		{
			name: 'Lithium Player',
			description: 'A lightweight music player built with Svelte.',
			repository: 'https://github.com/cl0udlab/Lithium-player'
		}
	];
</script>

<section>
	<div>
		<Github repository="https://github.com/cl0udlab/Lithium-player"></Github>
	</div>
</section>
