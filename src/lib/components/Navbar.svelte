<script>
	let mobileMenuOpen = false;

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<nav class="fixed top-0 right-0 left-0 z-50 border-b border-gray-800 bg-black/80 backdrop-blur-md">
	<div class="mx-auto max-w-6xl px-4">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center">
				<a
					href="/"
					class="text-xl font-bold text-white transition-colors duration-300 hover:text-gray-300"
				>
					white<span class="text-gray-400">cloud</span>
				</a>
			</div>

			<div class="hidden items-center space-x-8 md:flex">
				<a
					href="/projects"
					class="text-gray-300 transition-colors duration-300 hover:text-white">Project</a
				>
			</div>

			<div class="md:hidden">
				<button
					class="text-gray-300 hover:text-white focus:outline-none"
					on:click={toggleMobileMenu}
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						></path>
					</svg>
				</button>
			</div>
		</div>

		<div class="md:hidden {mobileMenuOpen ? 'block' : 'hidden'} pb-4">
			<div class="flex flex-col space-y-2">
				<a
					href="#projects"
					class="py-2 text-gray-300 transition-colors duration-300 hover:text-white"
					on:click={() => (mobileMenuOpen = false)}>作品</a
				>
			</div>
		</div>
	</div>
</nav>
