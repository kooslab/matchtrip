<script lang="ts">
	import { signIn, signOut } from '$lib/authClient';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { resetAllStores } from '$lib/stores/resetStores';
	import { browser } from '$app/environment';
	
	// Props from load function
	const { data } = $props();
	
	let loading = $state(false);
	
	// Get user data from props
	const user = $derived(data?.user);
	const userRole = $derived(data?.userRole);
	
	// Debug logging
	$effect(() => {
		console.log('[CLIENT] Browser:', browser);
		console.log('[CLIENT] Data prop:', data);
		console.log('[CLIENT] User:', user);
		console.log('[CLIENT] UserRole:', userRole);
		console.log('[CLIENT] $page store:', $page);
	});

	async function handleGoogleLogin() {
		loading = true;
		try {
			await signIn.social({
				provider: 'google'
			});
		} catch (err) {
			console.error('Google sign in error:', err);
			// Don't show error to user, just log it
		} finally {
			loading = false;
		}
	}
	
	async function handleLogout() {
		loading = true;
		try {
			// Reset all client-side stores first
			resetAllStores();
			
			// Sign out using better-auth
			await signOut();
			
			// Invalidate all data to refresh the page
			await invalidateAll();
			
			// Redirect to home page
			await goto('/', { replaceState: true, invalidateAll: true });
		} catch (error) {
			console.error('Logout error:', error);
			// Force reload on error
			if (typeof window !== 'undefined') {
				window.location.href = '/';
			}
		} finally {
			loading = false;
		}
	}
	
	async function navigateToDashboard() {
		if (userRole === 'guide') {
			await goto('/trips');
		} else {
			await goto('/my-trips');
		}
	}
</script>

{#if $page?.error}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-red-600">Error</h1>
			<p class="mt-2 text-gray-600">{$page.error?.message || 'An error occurred'}</p>
			<a href="/" class="mt-4 inline-block text-blue-600 hover:underline">Go to Home</a>
		</div>
	</div>
{:else}
		<!-- Splash Screen Style Landing Page -->
		<div class="relative min-h-screen overflow-hidden">
	<!-- Background Image -->
	<div class="absolute inset-0">
		<img 
			src="/image.png" 
			alt="Scenic mountain and lake view" 
			class="w-full h-full object-cover"
		/>
		<!-- Subtle gradient overlay -->
		<div class="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30"></div>
	</div>

	<!-- Main Content -->
	<div class="relative z-10 flex min-h-screen flex-col px-4">
		<!-- Logo in center -->
		<div class="flex flex-1 items-center justify-center pt-16">
			<img 
				src="/logo-1.png" 
				alt="Matchtrip Logo" 
				class="w-64 md:w-80 brightness-0 invert"
			/>
		</div>
		
		<!-- Bottom section - Login/Logout based on auth state -->
		<div class="pb-12 flex flex-col items-center gap-4">
			{#if user}
				<!-- User is logged in -->
				<div class="flex flex-col items-center gap-4">
					<p class="text-white text-sm font-medium">Welcome, {user?.email || user?.name || 'User'}</p>
					
					<div class="flex gap-4">
						<!-- Go to Dashboard button -->
						<button
							onclick={navigateToDashboard}
							disabled={loading}
							class="rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-lg transition-all hover:shadow-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Go to Dashboard
						</button>
						
						<!-- Logout button -->
						<button
							onclick={handleLogout}
							disabled={loading}
							class="rounded-full bg-white/20 backdrop-blur-sm px-6 py-3 text-sm font-medium text-white border border-white/30 shadow-lg transition-all hover:bg-white/30 hover:shadow-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Logout
						</button>
					</div>
				</div>
			{:else}
				<!-- User is not logged in -->
				<!-- Sign in text -->
				<p class="text-white text-sm font-medium">Sign In with Social Networks</p>
				
				<div class="flex flex-col items-center gap-3">
					<!-- Google button -->
					<button
						onclick={handleGoogleLogin}
						disabled={loading}
						class="rounded-full bg-white p-4 shadow-lg transition-all hover:shadow-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Sign in with Google"
					>
						<!-- Google Icon -->
						<svg class="h-6 w-6" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
					</button>
					
					<!-- Alternative sign in link -->
					<a href="/signin" class="text-white/80 text-xs hover:text-white underline">
						Sign in with Email
					</a>
				</div>
			{/if}
			
			<!-- Copyright text -->
			<p class="text-white/70 text-xs">© Matchtrip.corp.</p>
		</div>
	</div>
</div>
{/if}