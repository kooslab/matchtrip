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
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).replace(/\. /g, '. ').replace(/\.$/, '');
	}
</script>

<button
	{onclick}
	class="bg-white relative rounded-xl w-full text-left hover:shadow-md transition-shadow"
>
	<div class="absolute border border-[rgba(0,62,129,0.01)] border-solid inset-0 pointer-events-none rounded-xl" />
	<div class="relative size-full">
		<div class="box-border content-stretch flex flex-col gap-5 items-start justify-start p-[16px] relative w-full">
			<div class="box-border content-stretch flex flex-col gap-3 items-start justify-start p-0 relative shrink-0 w-full">
				<div class="box-border content-stretch flex flex-row items-center justify-between pb-3 pt-0 px-0 relative shrink-0 w-full">
					<div class="absolute border-[#f7f9fa] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
					<div class="font-bold leading-[0] not-italic relative shrink-0 text-[#052236] text-[16px] text-left text-nowrap">
						<p class="block leading-[24px] whitespace-pre">{offer.price.toLocaleString()}원</p>
					</div>
					<div class="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0">
						{#if showBadge && badgeText}
							<div class="box-border content-stretch flex flex-row gap-1 items-center justify-start p-0 relative shrink-0">
								<div
									class="box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-2 py-1 relative rounded shrink-0"
									style="background-color: {badgeColor || '#4daeeb'};"
								>
									<div
										class="absolute border border-solid inset-0 pointer-events-none rounded"
										style="border-color: {badgeColor || '#4daeeb'};"
									/>
									<div class="font-medium leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[11px] text-left text-nowrap">
										<p class="block leading-[12px] whitespace-pre">{badgeText}</p>
									</div>
								</div>
							</div>
						{/if}
						<div class="overflow-clip relative shrink-0 size-3">
							<div class="absolute bottom-[16.25%] left-[30.299%] right-[30.361%] top-[16.299%]">
								<img alt="" class="block max-w-none size-full" src={arrowRightUrl} />
							</div>
						</div>
					</div>
				</div>
				<div class="box-border content-stretch flex flex-row gap-4 items-center justify-start p-0 relative shrink-0 w-full">
					<div class="basis-0 box-border content-stretch flex flex-row gap-2 grow items-center justify-start min-h-px min-w-px p-0 relative shrink-0">
						<div class="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
							<div
								class="[background-size:cover,_auto] [grid-area:1_/_1] bg-[#f0f0f0] bg-[position:50%_50%,_0%_0%] ml-0 mt-0 relative rounded-[22px] size-11"
								style={offer.guideProfile?.profileImageUrl ? `background-image: url('${offer.guideProfile.profileImageUrl}')` : ''}
							>
								<div class="absolute border border-[rgba(0,62,129,0.01)] border-solid inset-0 pointer-events-none rounded-[22px]" />
								{#if !offer.guideProfile?.profileImageUrl}
									<div class="flex items-center justify-center w-full h-full text-gray-500 text-sm">
										{offer.guide?.name?.charAt(0) || '?'}
									</div>
								{/if}
							</div>
						</div>
						<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start p-0 relative shrink-0">
							<div class="box-border content-stretch flex flex-row gap-1 items-center justify-start p-0 relative shrink-0">
								<div class="font-semibold leading-[0] not-italic relative shrink-0 text-[#052236] text-[14px] text-left text-nowrap">
									<p class="block leading-[20px] whitespace-pre">{offer.guide?.name || '알 수 없는'} 가이드</p>
								</div>
							</div>
							<div class="box-border content-stretch flex flex-row items-center justify-start leading-[0] p-0 relative shrink-0">
								<div class="box-border content-stretch flex flex-row gap-0.5 items-center justify-start p-0 relative shrink-0">
									<div class="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
										<div class="[grid-area:1_/_1] box-border content-stretch flex flex-row items-start justify-start ml-0 mt-0 p-0 relative">
											<div class="overflow-clip relative shrink-0 size-3">
												<div class="absolute inset-[8.333%]">
													<img alt="" class="block max-w-none size-full" src={starIconUrl} />
												</div>
											</div>
										</div>
									</div>
									<div class="font-semibold not-italic relative shrink-0 text-[#536b7c] text-[12px] text-left text-nowrap">
										<p class="block leading-[18px] whitespace-pre">{offer.guideProfile?.avgRating?.toFixed(1) || '0.0'}</p>
									</div>
								</div>
								<div class="font-medium not-italic relative shrink-0 text-[#c9ccce] text-[11px] text-left text-nowrap">
									<p class="block leading-[16px] whitespace-pre">・</p>
								</div>
								<div class="font-medium not-italic relative shrink-0 text-[#919fa8] text-[11px] text-left text-nowrap">
									<p class="block leading-[16px] whitespace-pre">제안일 {formatDate(offer.createdAt)}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</button>