<script lang="ts">
	import logo from '$lib/images/Matchtrip.svg';
	
	interface Props {
		class?: string;
		height?: string;
	}
	
	const { class: className = '', height = 'h-5' }: Props = $props();
</script>

<a href="/" class="inline-flex items-center {className}">
	<img src={logo} alt="Matchtrip" class="{height} w-auto" />
</a>