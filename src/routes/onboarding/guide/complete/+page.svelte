<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import seeImage from '$lib/images/see.png';

	onMount(() => {
		// Redirect to trips after 3 seconds
		const timeout = setTimeout(() => {
			goto('/trips');
		}, 3000);

		return () => clearTimeout(timeout);
	});

	function handleGoToTrips() {
		goto('/trips');
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.content {
		text-align: center;
		max-width: 400px;
		width: 100%;
	}

	.success-icon {
		width: 160px;
		height: 160px;
		margin: 0 auto 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.success-icon img {
		width: 160px;
		height: 160px;
		object-fit: contain;
	}

	.title {
		font-family: 'Pretendard', sans-serif;
		font-weight: 700;
		font-size: 24px;
		line-height: 32px;
		color: #052236;
		margin-bottom: 16px;
	}

	.subtitle {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 15px;
		line-height: 24px;
		color: #8ea0ac;
		margin-bottom: 40px;
	}

	.home-button {
		width: 100%;
		height: 48px;
		background-color: #1095f4;
		border: none;
		border-radius: 9px;
		font-family: 'Pretendard', sans-serif;
		font-weight: 600;
		font-size: 14px;
		line-height: 20px;
		color: #ffffff;
		cursor: pointer;
		transition: background-color 0.2s ease;
		margin-bottom: 16px;
	}

	.home-button:hover {
		background-color: #0e7fcf;
	}

	.auto-redirect-text {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 11px;
		line-height: 16px;
		color: #c8d2d8;
	}
</style>

<div class="container">
	<div class="content">
		<div class="success-icon">
			<img src={seeImage} alt="완료" />
		</div>
		
		<h1 class="title">가이드 프로필 설정 완료!</h1>
		<p class="subtitle">가이드 승인 검토 후 알림을 보내드릴게요</p>
		
		<button class="home-button" onclick={handleGoToTrips}>
			여행 보러가기
		</button>
		
		<div class="auto-redirect-text">3초 후 자동으로 여행 페이지로 이동합니다</div>
	</div>
</div>