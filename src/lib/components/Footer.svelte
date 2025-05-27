<script lang="ts">
	// Get current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<footer class="mt-auto pt-8 pb-4 text-center text-sm text-gray-500">
	<div class="mb-4 flex w-full justify-center">
		<div class="h-px w-full bg-gray-600"></div>
	</div>
	<div class="mb-2 flex justify-center space-x-4">
		<a href="/terms" class="hover:text-gray-700 hover:underline">이용약관</a>
		<a href="/privacy" class="hover:text-gray-700 hover:underline">개인정보처리방침</a>
		<a href="/contact" class="hover:text-gray-700 hover:underline">문의하기</a>
	</div>
	<p>© {currentYear} MatchTrip. All rights reserved.</p>
</footer>
