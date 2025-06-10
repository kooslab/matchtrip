<script lang="ts">
	import { Settings, Shield, Database, Bell, Mail } from 'lucide-svelte';
</script>

<div class="p-8 overflow-auto h-full">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">설정</h1>
		<p class="mt-2 text-gray-600">시스템 설정을 관리합니다</p>
	</div>

	<div class="grid gap-6 max-w-4xl">
		<!-- System Settings -->
		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<Settings class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">시스템 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">시스템 설정 페이지는 현재 개발 중입니다.</p>
			</div>
		</div>

		<!-- Security Settings -->
		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<Shield class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">보안 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">보안 설정 옵션이 곧 추가될 예정입니다.</p>
			</div>
		</div>

		<!-- Database Settings -->
		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<Database class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">데이터베이스</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">데이터베이스 관리 도구가 곧 추가될 예정입니다.</p>
			</div>
		</div>

		<!-- Notification Settings -->
		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<Bell class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">알림 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">알림 설정이 곧 추가될 예정입니다.</p>
			</div>
		</div>

		<!-- Email Settings -->
		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<Mail class="h-6 w-6 text-gray-600" />
				<h2 class="text-xl font-semibold text-gray-900">이메일 설정</h2>
			</div>
			<div class="space-y-4">
				<p class="text-gray-600">이메일 템플릿 및 설정이 곧 추가될 예정입니다.</p>
			</div>
		</div>
	</div>
</div>