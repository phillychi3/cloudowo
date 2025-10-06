<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="relative h-full overflow-hidden p-6 font-mono text-sm text-white/90">
	<div
		class="scrollbar-thin scrollbar-track-black scrollbar-thumb-green-500 h-full space-y-6 overflow-y-auto"
	>
		<header class="border-b border-green-500 pb-4">
			<h1 class="mb-2 text-2xl font-bold">YASS - Yet Another Server Status</h1>
			<p class="text-sm">一個用 Rust 寫的輕量級伺服器監控系統</p>
		</header>

		<section>
			<h2 class="mb-3 text-lg font-bold">什麼是 YASS？</h2>
			<div class="space-y-3 leading-relaxed">
				<p>YASS 是一個簡單的伺服器監控解決方案</p>
			</div>
		</section>

		<section>
			<h2 class="mb-3 text-lg font-bold">主要功能</h2>
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="">✓</span>
					<span>CPU、記憶體、硬碟使用率即時監控</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="">✓</span>
					<span>網路流量統計</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="">✓</span>
					<span>系統運行時間追蹤</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="">✓</span>
					<span>簡潔的 Web 管理介面</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="">✓</span>
					<span>自動伺服器上下線檢測</span>
				</div>
			</div>
		</section>

		<section>
			<h2 class="mb-3 text-lg font-bold">安裝使用</h2>
			<div class="space-y-3">
				<p>安裝腳本還沒寫</p>
			</div>
		</section>

		<section>
			<h2 class="mb-3 text-lg font-bold">技術架構</h2>
			<div class="space-y-3">
				<p>選擇 Rust 的原因很簡單：效能好、安全、跨平台。</p>
				<div class="mt-3 grid grid-cols-2 gap-4">
					<div class="border border-green-700 bg-black/30 p-3">
						<div class="mb-2 text-sm font-bold">客戶端</div>
						<div class="space-y-1 text-xs">
							<div>• tokio</div>
							<div>• sysinfo</div>
							<div>• reqwest</div>
						</div>
					</div>
					<div class="border border-green-700 bg-black/30 p-3">
						<div class="mb-2 text-sm font-bold">伺服器端</div>
						<div class="space-y-1 text-xs">
							<div>• actix-web</div>
							<div>• serde</div>
							<div>• minijinja</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<footer class="border-t border-green-500 pt-4 text-center">
			<div class="text-xs">
				持續開發中 - <a href="https://github.com/cl0udlab/YASS" target="_blank">cl0udlab/YASS</a>
			</div>
		</footer>
	</div>
</div>
