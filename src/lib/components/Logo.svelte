<script lang="ts">
	import logo from '$lib/images/Matchtrip.png';
	import logoHQ from '$lib/images/Matchtrip-hq.jpg';
	
	interface Props {
		variant?: 'default' | 'hq';
		class?: string;
		height?: string;
	}
	
	const { variant = 'default', class: className = '', height = 'h-4' }: Props = $props();
	
	const logoSrc = $derived(variant === 'hq' ? logoHQ : logo);
</script>

<a href="/" class="inline-flex items-center {className}">
	<img src={logoSrc} alt="Matchtrip" class="{height} w-auto" />
</a>