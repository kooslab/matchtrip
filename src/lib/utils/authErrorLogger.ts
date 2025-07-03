// Auth error logger utility
export interface AuthError {
	timestamp: string;
	type: 'signin' | 'session' | 'callback' | 'config' | 'db';
	message: string;
	details?: any;
	stack?: string;
}

class AuthErrorLogger {
	private errors: AuthError[] = [];
	private maxErrors = 100;

	log(type: AuthError['type'], message: string, details?: any, error?: Error) {
		const authError: AuthError = {
			timestamp: new Date().toISOString(),
			type,
			message,
			details,
			stack: error?.stack
		};

		this.errors.push(authError);

		// Keep only the last maxErrors
		if (this.errors.length > this.maxErrors) {
			this.errors = this.errors.slice(-this.maxErrors);
		}

		// Also log to console with prefix
		console.error(`[AUTH ${type.toUpperCase()}]`, message, details || '', error || '');
	}

	getErrors(type?: AuthError['type']): AuthError[] {
		if (type) {
			return this.errors.filter((e) => e.type === type);
		}
		return [...this.errors];
	}

	getRecentErrors(minutes: number = 5): AuthError[] {
		const cutoff = new Date(Date.now() - minutes * 60 * 1000);
		return this.errors.filter((e) => new Date(e.timestamp) > cutoff);
	}

	clear() {
		this.errors = [];
	}
}

export const authErrorLogger = new AuthErrorLogger();
