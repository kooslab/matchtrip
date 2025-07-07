<script lang="ts">
	import { goto } from '$app/navigation';
	import walkImage from '$lib/images/walk.png';
	import logoImage from '$lib/images/Matchtrip.png';

	function handleGoHome() {
		goto('/my-trips');
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #ffffff;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 16px;
	}

	.logo {
		height: 24px;
	}

	.logo img {
		height: 100%;
		width: auto;
		object-fit: contain;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.content {
		max-width: 400px;
		width: 100%;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;
	}

	.image-container {
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.image-container img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.text-container {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.title {
		font-family: 'Pretendard', sans-serif;
		font-weight: 700;
		font-size: 24px;
		line-height: 32px;
		color: #052236;
	}

	.subtitle {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 14px;
		line-height: 22px;
		color: #666666;
	}

	.button-container {
		width: 100%;
		margin-top: 24px;
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
	}

	.home-button:hover {
		background-color: #0e7fd0;
	}

	.home-button:active {
		transform: scale(0.98);
	}
</style>

<div class="container">
	<!-- Header -->
	<header class="header">
		<div class="logo">
			<img src={logoImage} alt="Matchtrip" />
		</div>
	</header>

	<!-- Main Content -->
	<div class="main-content">
		<div class="content">
			<div class="image-container">
				<img src={walkImage} alt="여행자 일러스트" />
			</div>
			
			<div class="text-container">
				<h1 class="title">가입이 완료되었습니다!</h1>
				<p class="subtitle">
					이제 매치트립에서 여행을 계획하고<br />
					현지 가이드와 함께 특별한 경험을 만들어보세요
				</p>
			</div>

			<div class="button-container">
				<button class="home-button" onclick={handleGoHome}>
					홈으로
				</button>
			</div>
		</div>
	</div>
</div>