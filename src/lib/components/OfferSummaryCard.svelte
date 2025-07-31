<script lang="ts">
	import starIconUrl from '$lib/icons/icon-star-mono.svg';
	import arrowRightUrl from '$lib/icons/icon-arrow-right-small-mono.svg';

	interface Props {
		offer: {
			id: string;
			price: number;
			status: string;
			guide?: {
				id: string;
				name: string;
				profileImage?: string;
			};
			guideProfile?: {
				avgRating?: number;
				profileImageUrl?: string;
			};
			createdAt: string;
		};
		onclick?: () => void;
		showBadge?: boolean;
		badgeText?: string;
		badgeColor?: string;
	}

	let { offer, onclick, showBadge = false, badgeText, badgeColor }: Props = $props();

	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj
			.toLocaleDateString('ko-KR', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			})
			.replace(/\. /g, '. ')
			.replace(/\.$/, '');
	}
</script>

<button
	{onclick}
	class="relative w-full rounded-xl bg-white text-left transition-shadow hover:shadow-md"
>
	<div
		class="pointer-events-none absolute inset-0 rounded-xl border border-solid border-[rgba(0,62,129,0.01)]"
	/>
	<div class="relative size-full">
		<div
			class="relative box-border flex w-full flex-col content-stretch items-start justify-start gap-5 p-[16px]"
		>
			<div
				class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-3 p-0"
			>
				<div
					class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between px-0 pt-0 pb-3"
				>
					<div
						class="pointer-events-none absolute inset-0 border-[0px_0px_1px] border-solid border-[#f7f9fa]"
					/>
					<div
						class="relative shrink-0 text-left text-[16px] leading-[0] font-bold text-nowrap text-[#052236] not-italic"
					>
						<p class="block leading-[24px] whitespace-pre">{offer.price.toLocaleString()}원</p>
					</div>
					<div
						class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-2 p-0"
					>
						{#if showBadge && badgeText}
							<div
								class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-1 p-0"
							>
								<div
									class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-center gap-2.5 rounded px-2 py-1"
									style="background-color: {badgeColor || '#4daeeb'};"
								>
									<div
										class="pointer-events-none absolute inset-0 rounded border border-solid"
										style="border-color: {badgeColor || '#4daeeb'};"
									/>
									<div
										class="relative shrink-0 text-left text-[11px] leading-[0] font-medium text-nowrap text-[#ffffff] not-italic"
									>
										<p class="block leading-[12px] whitespace-pre">{badgeText}</p>
									</div>
								</div>
							</div>
						{/if}
						<div class="relative size-3 shrink-0 overflow-clip">
							<div class="absolute top-[16.299%] right-[30.361%] bottom-[16.25%] left-[30.299%]">
								<img alt="" class="block size-full max-w-none" src={arrowRightUrl} />
							</div>
						</div>
					</div>
				</div>
				<div
					class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-start gap-4 p-0"
				>
					<div
						class="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-row content-stretch items-center justify-start gap-2 p-0"
					>
						<div
							class="relative inline-grid shrink-0 grid-cols-[max-content] grid-rows-[max-content] place-items-start leading-[0]"
						>
							<div
								class="relative mt-0 ml-0 size-11 rounded-[22px] bg-[#f0f0f0] [background-size:cover,_auto] bg-[position:50%_50%,_0%_0%] [grid-area:1_/_1]"
								style={offer.guideProfile?.profileImageUrl
									? `background-image: url('${offer.guideProfile.profileImageUrl}')`
									: ''}
							>
								<div
									class="pointer-events-none absolute inset-0 rounded-[22px] border border-solid border-[rgba(0,62,129,0.01)]"
								/>
								{#if !offer.guideProfile?.profileImageUrl}
									<div class="flex h-full w-full items-center justify-center text-sm text-gray-500">
										{offer.guide?.name?.charAt(0) || '?'}
									</div>
								{/if}
							</div>
						</div>
						<div
							class="relative box-border flex shrink-0 flex-col content-stretch items-start justify-start gap-1 p-0"
						>
							<div
								class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-1 p-0"
							>
								<div
									class="relative shrink-0 text-left text-[14px] leading-[0] font-semibold text-nowrap text-[#052236] not-italic"
								>
									<p class="block leading-[20px] whitespace-pre">
										{offer.guide?.name || '알 수 없는'} 가이드
									</p>
								</div>
							</div>
							<div
								class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start p-0 leading-[0]"
							>
								<div
									class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-0.5 p-0"
								>
									<div
										class="relative inline-grid shrink-0 grid-cols-[max-content] grid-rows-[max-content] place-items-start"
									>
										<div
											class="relative mt-0 ml-0 box-border flex flex-row content-stretch items-start justify-start p-0 [grid-area:1_/_1]"
										>
											<div class="relative size-3 shrink-0 overflow-clip">
												<div class="absolute inset-[8.333%]">
													<img alt="" class="block size-full max-w-none" src={starIconUrl} />
												</div>
											</div>
										</div>
									</div>
									<div
										class="relative shrink-0 text-left text-[12px] font-semibold text-nowrap text-[#536b7c] not-italic"
									>
										<p class="block leading-[18px] whitespace-pre">
											{offer.guideProfile?.avgRating?.toFixed(1) || '0.0'}
										</p>
									</div>
								</div>
								<div
									class="relative shrink-0 text-left text-[11px] font-medium text-nowrap text-[#c9ccce] not-italic"
								>
									<p class="block leading-[16px] whitespace-pre">・</p>
								</div>
								<div
									class="relative shrink-0 text-left text-[11px] font-medium text-nowrap text-[#919fa8] not-italic"
								>
									<p class="block leading-[16px] whitespace-pre">
										제안일 {formatDate(offer.createdAt)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</button>
