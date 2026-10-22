<script lang="ts">
	let { full = false, scale = 3 }: { full?: boolean; scale?: number } = $props();

	const bar = $derived(full ? '#39ff88' : '#5a1a1a');
</script>

<svg
	width={16 * scale}
	height={6 * scale}
	viewBox="0 0 16 6"
	shape-rendering="crispEdges"
	aria-hidden="true"
>
	<rect x="0" y="0" width="15" height="6" fill="#38443f" />
	<rect x="1" y="1" width="13" height="4" fill="#101715" />
	<rect x="1" y="1" width="3" height="4" fill="#c8a040" />
	<rect x="15" y="2" width="1" height="2" fill="#7a5530" />
	<rect x="5" y="2" width="2" height="2" fill={bar} />
	<rect x="8" y="2" width="2" height="2" fill={full ? bar : '#1c2624'} />
	<rect x="11" y="2" width="2" height="2" fill={full ? bar : '#1c2624'} />
</svg>
