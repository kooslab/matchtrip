<script lang="ts">
	import { Settings, Shield, Database, Bell, Mail } from 'lucide-svelte';
</script>

<div class="h-full overflow-auto p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">설정</h1>
		<p class="mt-2 text-gray-600">시스템 설정을 관리합니다</p>
	</div>

	<div class="grid max-w-4xl gap-6">
		<!-- System Settings -->
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="mb-4 flex items-center gap-3">
				<Settings class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">시스템 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">시스템 설정 페이지는 현재 개발 중입니다.</p>
			</div>
		</div>

		<!-- Security Settings -->
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="mb-4 flex items-center gap-3">
				<Shield class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">보안 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">보안 설정 옵션이 곧 추가될 예정입니다.</p>
			</div>
		</div>

		<!-- Database Settings -->
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="mb-4 flex items-center gap-3">
				<Database class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">데이터베이스</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">데이터베이스 관리 도구가 곧 추가될 예정입니다.</p>
			</div>
		</div>

		<!-- Notification Settings -->
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="mb-4 flex items-center gap-3">
				<Bell class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">알림 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">알림 설정이 곧 추가될 예정입니다.</p>
			</div>
		</div>

		<!-- Email Settings -->
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="mb-4 flex items-center gap-3">
				<Mail class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">이메일 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">이메일 템플릿 및 설정이 곧 추가될 예정입니다.</p>
			</div>
		</div>
	</div>
</div>
