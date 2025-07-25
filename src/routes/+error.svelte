<script>
	import { page } from '$app/state';
</script>

<div>
	{#if page?.error}
		<div class="mt-4 p-4">
			{#if page?.status}
				<p>Page status: {page?.status}</p>
				<img src="https://http.cat/{page?.status}" alt="HTTP status code" />
			{/if}
			{#if page?.error?.message}
				<p>Error message: {page?.error?.message}</p>
			{/if}
		</div>
	{/if}
</div>
