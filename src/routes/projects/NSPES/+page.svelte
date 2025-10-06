<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="relative h-full overflow-hidden p-6 font-mono text-sm text-white/90">
	<div
		class="scrollbar-thin scrollbar-track-black scrollbar-thumb-gray-500 h-full space-y-6 overflow-y-auto"
	>
		<header class="border-b border-gray-500 pb-4">
			<h1 class="mb-2 text-2xl font-bold text-white">NYUST Senior Project Evaluation System</h1>
			<p class="text-sm text-gray-300">期末專題評分管理系統</p>
		</header>

		<section>
			<h2 class="mb-3 text-lg font-bold text-white">專案簡介</h2>
			<div class="space-y-3 leading-relaxed text-gray-300">
				<p>
					NYUST Senior Project Evaluation System 是一個用於管理與評估學生專案的系統，
					後端主要使用Go，前端則使用Svelte。
				</p>
			</div>
		</section>

		<section>
			<h2 class="mb-3 text-lg font-bold text-white">系統特色</h2>
			<div class="space-y-2 text-gray-300">
				<div class="space-y-4">
					<div class="bg-black/30">
						<h3 class="mb-2 font-bold text-white">1. 方便教授快速評分</h3>
						<p>減少系辦壓力，讓教授能夠透過系統快速完成專題評分作業</p>
					</div>

					<div class="bg-black/30">
						<h3 class="mb-2 font-bold text-white">2. 系辦方便管理人員</h3>
						<p>提供完整的管理介面，讓系辦人員能夠輕鬆處理專題相關行政事務</p>
					</div>

					<div class="bg-black/30">
						<h3 class="mb-2 font-bold text-white">3. 學生透過系統繳交文件</h3>
						<p>避免缺交問題，確保所有必要文件都能準時且完整地提交</p>
					</div>

					<div class="bg-black/30">
						<h3 class="mb-2 font-bold text-white">4. 線上收集專題資料</h3>
						<p>數位化管理專題資料，提高資料保存與查詢的效率</p>
					</div>
				</div>
			</div>
		</section>

		<footer class="border-t border-gray-500 pt-4 text-center">
			<div class="text-xs text-gray-400">phillychi3 - 私人專案</div>
		</footer>
	</div>
</div>
