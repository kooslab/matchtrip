import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '$env/static/private';
import { env } from '$env/dynamic/public';

const resend = new Resend(RESEND_API_KEY);

export async function sendVerificationEmail(email: string, verificationUrl: string) {
	// Better-auth provides the complete URL, no need to construct it

	try {
		const { data, error } = await resend.emails.send({
			from: `MatchTrip <noreply@${RESEND_FROM_EMAIL}>`,
			to: email,
			subject: 'MatchTrip 이메일 인증',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">MatchTrip 이메일 인증</h2>
					<p>안녕하세요,</p>
					<p>MatchTrip에 가입해 주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 주소를 인증해 주세요.</p>
					<div style="margin: 30px 0;">
						<a href="${verificationUrl}" 
						   style="background-color: #5A7D7C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
							이메일 인증하기
						</a>
					</div>
					<p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
					<p style="color: #666; word-break: break-all;">${verificationUrl}</p>
					<p style="margin-top: 30px; color: #666;">이 링크는 24시간 동안 유효합니다.</p>
					<p style="color: #666;">만약 MatchTrip에 가입하지 않으셨다면 이 이메일을 무시해 주세요.</p>
				</div>
			`
		});

		if (error) {
			console.error('Failed to send verification email:', error);
			throw error;
		}

		return { success: true, data };
	} catch (error) {
		console.error('Error sending verification email:', error);
		throw error;
	}
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
	// Better-auth provides the complete reset URL, no need to construct it

	try {
		const { data, error } = await resend.emails.send({
			from: `MatchTrip <noreply@${RESEND_FROM_EMAIL}>`,
			to: email,
			subject: 'MatchTrip 비밀번호 재설정',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">MatchTrip 비밀번호 재설정</h2>
					<p>안녕하세요,</p>
					<p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해 주세요.</p>
					<div style="margin: 30px 0;">
						<a href="${resetUrl}" 
						   style="background-color: #5A7D7C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
							비밀번호 재설정
						</a>
					</div>
					<p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
					<p style="color: #666; word-break: break-all;">${resetUrl}</p>
					<p style="margin-top: 30px; color: #666;">이 링크는 1시간 동안 유효합니다.</p>
					<p style="color: #666;">만약 비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시해 주세요.</p>
				</div>
			`
		});

		if (error) {
			console.error('Failed to send password reset email:', error);
			throw error;
		}

		return { success: true, data };
	} catch (error) {
		console.error('Error sending password reset email:', error);
		throw error;
	}
}