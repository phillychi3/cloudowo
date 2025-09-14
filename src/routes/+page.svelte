<script>
	import Navbar from '$lib/components/Navbar.svelte';
</script>

<Navbar />
<section
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black"
>
	<div class="z-10 px-4 text-center">
		<h1 class="animate-fade-in mb-6 text-6xl font-bold tracking-tight text-white md:text-8xl">
			White<span class="text-gray-300">Cloud</span>
		</h1>
		<p class="animate-fade-in-delay mb-8 text-xl font-light text-gray-300 md:text-2xl">
			一些語錄
		</p>

		<div class="animate-bounce">
			<svg
				class="mx-auto h-6 w-6 text-gray-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				></path>
			</svg>
		</div>
	</div>
</section>

<section class="bg-white py-20">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-16 text-center text-4xl font-bold text-black">其他雲</h2>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-3">
			<div class="group">
				<div
					class="transform rounded-2xl bg-gray-900 p-8 text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
				>
					<div class="text-center">
						<h3 class="mb-2 text-xl font-semibold">黑雲</h3>
					</div>
				</div>
			</div>

			<div class="group">
				<div
					class="transform rounded-2xl border border-gray-300 bg-gray-100 p-8 transition-all duration-300 hover:scale-105 hover:border-gray-600 hover:shadow-2xl"
				>
					<div class="text-center">
						<h3 class="mb-2 text-xl font-semibold text-gray-800">星雲</h3>
					</div>
				</div>
			</div>

			<div class="group">
				<div
					class="transform rounded-2xl bg-gradient-to-br from-gray-200 to-gray-400 p-8 text-gray-800 transition-all duration-300 hover:scale-105 hover:from-gray-800 hover:to-black hover:text-white hover:shadow-2xl"
				>
					<div class="text-center">
						<h3 class="mb-2 text-xl font-semibold">暗雲</h3>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<section id="projects" class="bg-gray-100 py-20">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-16 text-center text-4xl font-bold text-black">Project</h2>

		<!-- WIP -->
		<div class="text-center">
			<a
				href="/projects"
				class="inline-flex transform items-center rounded-2xl border border-black bg-black px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-800 hover:shadow-xl"
			>
				查看所有作品
				<svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 8l4 4m0 0l-4 4m4-4H3"
					></path>
				</svg>
			</a>
		</div>
	</div>
</section>

<section class="bg-white py-20">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-16 text-center text-4xl font-bold text-black">興趣愛好</h2>
		<!-- WIP -->
	</div>
</section>
<footer class="border-t border-gray-800 bg-black py-16 text-center text-white">
	<p class="text-gray-400">
		© 2025 CloudOwo. Made with <span class="text-white">❤️</span> and Svelte
	</p>
</footer>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 1s ease-out;
	}

	.animate-fade-in-delay {
		animation: fade-in 1s ease-out 0.3s both;
	}

	.animate-fade-in-delay-2 {
		animation: fade-in 1s ease-out 0.6s both;
	}
</style>
