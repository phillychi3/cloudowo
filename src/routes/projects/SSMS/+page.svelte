<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="relative h-full overflow-hidden p-6 font-mono text-sm text-white/90">
	<div
		class="scrollbar-thin scrollbar-track-black scrollbar-thumb-green-500 h-full space-y-6 overflow-y-auto"
	>
		<header class="border-b border-green-500 pb-4">
			<h1 class="mb-2 text-2xl font-bold">SSMS - Sister School Management System</h1>
			<p class="text-sm">國際處姊妹校管理系統</p>
		</header>

		<section>
			<h2 class="mb-3 text-lg font-bold">什麼是 SSMS？</h2>
			<div class="space-y-3 leading-relaxed">
				<p>
					Sister School Management
					System（SSMS）分為前端（SSMS-frontend）與後端（SSMS-Backend）兩大部分。
				</p>
				<p>
					透過現代化的網頁技術，協助教育機構有效率地管理姊妹校相關資料、人員、活動與交流記錄，
					提升國際合作與校際交流的便利性與透明度。
				</p>
			</div>
		</section>

		<section>
			<h2 class="mb-3 text-lg font-bold">核心功能</h2>
			<div class="space-y-4">
				<div class="space-y-1 text-xs">
					<div>• 新增、編輯、查詢和刪除姊妹校基本資料</div>
					<div>• 管理姊妹校合作協議與重要文件</div>
				</div>

				<div class="space-y-1 text-xs">
					<div>• 記錄師生互訪、聯合課程、線上會議等活動</div>
					<div>• 活動日程、參與人員、成果報告等細節管理</div>
				</div>

				<div class="space-y-1 text-xs">
					<div>• 管理參與國際交流的師生基本資料</div>
					<div>• 記錄個人參與經歷、貢獻與表現</div>
				</div>

				<div class="space-y-1 text-xs">
					<div>• 重要活動的行事曆與自動提醒功能</div>
					<div>• 合作協議到期提醒與續約建議</div>
				</div>

				<div class="space-y-1 text-xs">
					<div>• 多條件查詢姊妹校或交流活動資料</div>
					<div>• 匯出統計分析報表，輔助決策制定</div>
				</div>
			</div>
		</section>

		<section>
			<h2 class="mb-3 text-lg font-bold">系統架構</h2>
			<div class="space-y-3">
				<div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="border border-green-700 bg-black/30 p-3">
						<div class="mb-2 text-sm font-bold">前端 (SSMS-frontend)</div>
						<div class="space-y-1 text-xs">
							<div>• quasar 框架</div>
							<div>• 響應式使用者介面</div>
						</div>
					</div>
					<div class="border border-green-700 bg-black/30 p-3">
						<div class="mb-2 text-sm font-bold">後端 (SSMS-Backend)</div>
						<div class="space-y-1 text-xs">
							<div>• Express</div>
							<div>• Prisma</div>
							<div>• OpenAPi</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<footer class="border-t border-green-500 pt-4 text-center">
			<div class="text-xs">Sister School Management System - 私人專案</div>
		</footer>
	</div>
</div>
