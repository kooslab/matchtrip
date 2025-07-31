import { db } from '$lib/server/db';
import { phoneVerifications } from '$lib/server/db/schema';
import { eq, and, lt, gt, desc } from 'drizzle-orm';

const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_EXPIRY_MINUTES = 3;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MINUTES = 1;
const MAX_CODES_PER_HOUR = 5;

export function generateVerificationCode(): string {
	const code = Math.floor(100000 + Math.random() * 900000).toString();
	return code;
}

export function formatPhoneForSMS(phone: string): string {
	// Remove any non-numeric characters (including dashes)
	const cleaned = phone.replace(/\D/g, '');

	// For Korean numbers starting with 0 (010, 011, 016, 017, 018, 019)
	if (cleaned.startsWith('0')) {
		// Remove leading 0 and add +82
		return `+82${cleaned.substring(1)}`;
	}

	// If already has country code 82 (without +)
	if (cleaned.startsWith('82')) {
		return `+${cleaned}`;
	}

	// If already has +82
	if (phone.startsWith('+82')) {
		return phone;
	}

	// Return with + prefix for other international formats
	return `+${cleaned}`;
}

export async function canSendVerificationCode(
	phone: string
): Promise<{ allowed: boolean; reason?: string }> {
	// Check for recent codes sent to this phone number
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
	const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

	// Check rate limit - no more than 1 code per minute
	const recentCode = await db
		.select()
		.from(phoneVerifications)
		.where(and(eq(phoneVerifications.phone, phone), gt(phoneVerifications.createdAt, oneMinuteAgo)))
		.limit(1);

	if (recentCode.length > 0) {
		return { allowed: false, reason: '1분 후에 다시 시도해주세요.' };
	}

	// Check hourly limit - no more than 5 codes per hour
	const hourlyCount = await db
		.select()
		.from(phoneVerifications)
		.where(and(eq(phoneVerifications.phone, phone), gt(phoneVerifications.createdAt, oneHourAgo)));

	if (hourlyCount.length >= MAX_CODES_PER_HOUR) {
		return {
			allowed: false,
			reason: '너무 많은 인증 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
		};
	}

	return { allowed: true };
}

export async function createVerificationCode(phone: string): Promise<string> {
	const code = generateVerificationCode();
	const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

	// Delete any existing unverified codes for this phone
	await db
		.delete(phoneVerifications)
		.where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.verified, false)));

	// Create new verification code
	await db.insert(phoneVerifications).values({
		phone,
		code,
		expiresAt,
		verified: false,
		attempts: 0
	});

	return code;
}

export async function verifyCode(
	phone: string,
	code: string
): Promise<{ success: boolean; reason?: string }> {
	console.log('[verifyCode] Verifying:', { phone, code });

	// Find the most recent verification code for this phone
	const verificationRecord = await db
		.select()
		.from(phoneVerifications)
		.where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.verified, false)))
		.orderBy(desc(phoneVerifications.createdAt))
		.limit(1);

	console.log('[verifyCode] Found records:', verificationRecord.length);
	if (verificationRecord.length > 0) {
		console.log('[verifyCode] Record:', {
			phone: verificationRecord[0].phone,
			code: verificationRecord[0].code,
			expiresAt: verificationRecord[0].expiresAt,
			attempts: verificationRecord[0].attempts
		});
	}

	if (verificationRecord.length === 0) {
		return { success: false, reason: '인증번호를 찾을 수 없습니다. 다시 요청해주세요.' };
	}

	const record = verificationRecord[0];

	// Check if code has expired
	if (new Date() > record.expiresAt) {
		return { success: false, reason: '인증번호가 만료되었습니다. 다시 요청해주세요.' };
	}

	// Check attempts
	if (record.attempts >= MAX_ATTEMPTS) {
		return { success: false, reason: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' };
	}

	// Verify the code
	console.log('[verifyCode] Comparing:', {
		provided: code,
		stored: record.code,
		match: record.code === code
	});

	if (record.code !== code) {
		// Increment attempts
		await db
			.update(phoneVerifications)
			.set({ attempts: record.attempts + 1 })
			.where(eq(phoneVerifications.id, record.id));

		return { success: false, reason: '인증번호가 올바르지 않습니다.' };
	}

	// Mark as verified
	await db
		.update(phoneVerifications)
		.set({ verified: true })
		.where(eq(phoneVerifications.id, record.id));

	return { success: true };
}

export async function cleanupExpiredCodes(): Promise<void> {
	const now = new Date();
	await db
		.delete(phoneVerifications)
		.where(and(lt(phoneVerifications.expiresAt, now), eq(phoneVerifications.verified, false)));
}
