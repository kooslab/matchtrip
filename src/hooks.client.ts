import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,

	// Only enable in production
	enabled: import.meta.env.PROD,

	// Set environment
	environment: import.meta.env.MODE,

	// Adjust this value in production, or use tracesSampler for greater control
	tracesSampleRate: 0,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,

	// Capture unhandled promise rejections
	integrations: [
		Sentry.browserTracingIntegration(),
		Sentry.replayIntegration({
			// Don't capture replays by default - only on errors
			maskAllText: true,
			blockAllMedia: true
		})
	],

	// Capture Replay only on errors
	replaysSessionSampleRate: 0,
	replaysOnErrorSampleRate: 1.0
});
