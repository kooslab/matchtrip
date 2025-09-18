<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	
	// Watch for page changes and scroll to top
	$: if (browser && $page.url.pathname) {
		// Force immediate scroll to top on any page change
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}
</script>

<slot />