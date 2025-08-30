<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let particles: Particle[] = [];

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		color: string;
		size: number;
		angle: number;
		angularVelocity: number;
	}

	const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

	function createParticle(): Particle {
		return {
			x: Math.random() * window.innerWidth,
			y: -10,
			vx: (Math.random() - 0.5) * 2,
			vy: Math.random() * 3 + 2,
			color: colors[Math.floor(Math.random() * colors.length)],
			size: Math.random() * 4 + 2,
			angle: Math.random() * Math.PI * 2,
			angularVelocity: (Math.random() - 0.5) * 0.2
		};
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Create initial particles
		for (let i = 0; i < 100; i++) {
			particles.push(createParticle());
		}

		let animationId: number;

		function animate() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			particles = particles.filter((particle) => {
				particle.x += particle.vx;
				particle.y += particle.vy;
				particle.vy += 0.1; // gravity
				particle.angle += particle.angularVelocity;

				// Draw particle
				ctx.save();
				ctx.translate(particle.x, particle.y);
				ctx.rotate(particle.angle);
				ctx.fillStyle = particle.color;
				ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
				ctx.restore();

				// Remove particles that are off screen
				return particle.y < canvas.height + 10;
			});

			// Add new particles occasionally
			if (particles.length < 100 && Math.random() < 0.3) {
				particles.push(createParticle());
			}

			animationId = requestAnimationFrame(animate);
		}

		animate();

		// Handle resize
		function handleResize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}

		window.addEventListener('resize', handleResize);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<canvas bind:this={canvas} class="pointer-events-none fixed inset-0" style="z-index: 50;"></canvas>
