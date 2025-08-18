<script lang="ts">
	import { Calculator, Info, AlertTriangle } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils/refundCalculator';

	interface Props {
		originalAmount: number;
		refundAmount: number;
		refundPercentage: number;
		deductionAmount: number;
		policyApplied: string;
		daysBeforeTrip: number;
		requiresAdminApproval?: boolean;
	}

	let {
		originalAmount,
		refundAmount,
		refundPercentage,
		deductionAmount,
		policyApplied,
		daysBeforeTrip,
		requiresAdminApproval = false
	}: Props = $props();
</script>

<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
	<div class="mb-3 flex items-center gap-2">
		<Calculator class="text-primary h-5 w-5" />
		<h4 class="font-semibold">예상 환불 금액</h4>
	</div>

	<div class="space-y-2">
		<!-- Days Before Trip -->
		<div class="flex justify-between text-sm">
			<span class="text-gray-600">여행일까지 남은 기간:</span>
			<span class="font-medium"
				>{daysBeforeTrip < 0
					? `종료 ${Math.abs(daysBeforeTrip)}일 경과`
					: `${daysBeforeTrip}일`}</span
			>
		</div>

		<!-- Policy Applied -->
		<div class="flex justify-between text-sm">
			<span class="text-gray-600">적용 정책:</span>
			<span class="font-medium">{policyApplied}</span>
		</div>

		<!-- Original Amount -->
		<div class="flex justify-between text-sm">
			<span class="text-gray-600">결제 금액:</span>
			<span class="font-medium">{formatCurrency(originalAmount)}</span>
		</div>

		<!-- Deduction -->
		{#if deductionAmount > 0}
			<div class="flex justify-between text-sm">
				<span class="text-gray-600">공제 금액 ({100 - refundPercentage}%):</span>
				<span class="font-medium text-red-600">-{formatCurrency(deductionAmount)}</span>
			</div>
		{/if}

		<!-- Divider -->
		<div class="border-t pt-2"></div>

		<!-- Refund Amount -->
		<div class="flex justify-between">
			<span class="font-semibold">환불 예정 금액:</span>
			<span class="text-primary text-lg font-bold">
				{formatCurrency(refundAmount)}
			</span>
		</div>

		<!-- Refund Percentage -->
		<div class="flex justify-between text-sm">
			<span class="text-gray-600">환불율:</span>
			<span class="font-medium">{refundPercentage}%</span>
		</div>
	</div>

	<!-- Admin Approval Notice -->
	{#if requiresAdminApproval}
		<div class="mt-3 rounded border border-yellow-200 bg-yellow-50 p-2">
			<div class="flex items-start gap-2">
				<AlertTriangle class="mt-0.5 h-4 w-4 text-yellow-600" />
				<div class="text-xs text-yellow-800">
					<p class="font-semibold">관리자 승인 필요</p>
					<p class="mt-1">
						예외 상황으로 인한 취소는 증빙 서류 검토 후 관리자 승인이 필요합니다. 승인 시 전액
						환불됩니다.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Info Notice -->
	<div class="mt-3 rounded border border-blue-200 bg-blue-50 p-2">
		<div class="flex items-start gap-2">
			<Info class="mt-0.5 h-4 w-4 text-blue-600" />
			<p class="text-xs text-blue-800">
				실제 환불 금액은 결제 수단 및 카드사 정책에 따라 약간의 차이가 있을 수 있습니다. 환불은
				영업일 기준 3-5일 내에 처리됩니다.
			</p>
		</div>
	</div>
</div>
