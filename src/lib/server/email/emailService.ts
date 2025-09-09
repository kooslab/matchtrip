import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
	if (!resend || !env.RESEND_API_KEY) {
		console.error('[EmailService] Resend is not configured. Please set RESEND_API_KEY.');
		throw new Error('Email service is not configured');
	}

	try {
		// Ensure from email is in correct format
		let fromEmail = env.RESEND_FROM_EMAIL || 'no-reply@mail.matchtrip.net';
		
		// If it's just a domain, convert to a proper email format
		if (fromEmail && !fromEmail.includes('@')) {
			fromEmail = `no-reply@${fromEmail}`;
		}

		// Add display name if not already in "Name <email>" format
		if (fromEmail && !fromEmail.includes('<')) {
			fromEmail = `MatchTrip <${fromEmail}>`;
		}

		console.log('[EmailService] Sending email:', {
			from: fromEmail,
			to,
			subject
		});

		const { data, error } = await resend.emails.send({
			from: fromEmail,
			to,
			subject,
			html,
			text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version if not provided
		});

		if (error) {
			console.error('[EmailService] Email send error:', error);
			throw new Error(`Failed to send email: ${error.message}`);
		}

		console.log('[EmailService] Email sent successfully:', data);
		return data;
	} catch (error) {
		console.error('[EmailService] Email send error:', error);
		throw error;
	}
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
	return !!env.RESEND_API_KEY;
}