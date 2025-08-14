<script lang="ts">
	import type { PageProps } from './$types';
	import { Github } from 'svelte-github-card';

	let { data }: PageProps = $props();
</script>

<section>
	<div>
		<Github repository="https://github.com/cl0udlab/Lithium-player"></Github>
	</div>
</section>
