import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	users,
	userAgreements,
	guideProfiles,
	travelerProfiles,
	fileUploads
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

export async function POST({ request }) {
	const requestData = await request.json();
	const {
		email,
		password,
		name,
		phone,
		birthDate,
		role,
		termsAgreed = false,
		privacyAgreed = false,
		marketingAgreed = false,
		// Guide-specific fields
		currentLocation,
		destinations,
		introduction,
		profileImageUrl,
		idDocumentUrl,
		guideLicenseUrl,
		driverLicenseUrl,
		carInsuranceUrl,
		// Traveler-specific fields
		nationality,
		travelStyle,
		budgetRange,
		preferredLanguages,
		travelFrequency,
		interests,
		dietaryRestrictions,
		accessibilityNeeds,
		emergencyContact,
		emergencyPhone
	} = requestData;

	console.log('requestData', requestData);

	// Log the password length and first character for debugging
	console.log('password', password);
	console.log('Password length:', password?.length);
	console.log('Password has number:', /\d/.test(password));
	console.log('Password has special char:', /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]+/.test(password));

	// Validate required agreements
	if (!termsAgreed || !privacyAgreed) {
		return json(
			{
				success: false,
				error: '이용약관과 개인정보 처리방침에 동의해 주세요.'
			},
			{ status: 400 }
		);
	}

	// Validate role-specific required fields
	if (role === 'guide') {
		if (!currentLocation || !destinations || !introduction) {
			return json(
				{
					success: false,
					error: '가이드 등록에 필요한 모든 정보를 입력해주세요.'
				},
				{ status: 400 }
			);
		}
	} else if (role === 'traveler') {
		if (
			!nationality ||
			!travelStyle ||
			!budgetRange ||
			!preferredLanguages ||
			!travelFrequency ||
			!interests ||
			!dietaryRestrictions ||
			!emergencyContact ||
			!emergencyPhone
		) {
			return json(
				{
					success: false,
					error: '여행자 등록에 필요한 모든 정보를 입력해주세요.'
				},
				{ status: 400 }
			);
		}
	}

	try {
		// Use auth.api directly with the correct method name
		const result = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name
			}
		});

		// If we get here, signup was successful and we have a user
		if (result && result.user && result.user.id) {
			const userId = result.user.id;
			const now = new Date();

			// Update the user's basic info and role after signup
			await db
				.update(users)
				.set({
					role,
					phone,
					birthDate: birthDate || null
				})
				.where(eq(users.id, userId));

			// Create user agreements record
			await db.insert(userAgreements).values({
				userId,
				termsAgreed,
				privacyAgreed,
				marketingAgreed,
				termsAgreedAt: termsAgreed ? now : null,
				privacyAgreedAt: privacyAgreed ? now : null,
				marketingAgreedAt: marketingAgreed ? now : null,
				updatedAt: now
			});

			// Create role-specific profile
			if (role === 'guide') {
				await db.insert(guideProfiles).values({
					userId,
					currentLocation,
					activityAreas: destinations,
					introduction,
					profileImageUrl,
					idDocumentUrl,
					createdAt: now,
					updatedAt: now
				});

				// Create file upload records for guide files
				const fileRecords = [];
				if (profileImageUrl) {
					fileRecords.push({
						userId,
						filename: profileImageUrl.split('/').pop() || 'profile.jpg',
						originalName: 'profile.jpg',
						fileType: 'image/jpeg',
						fileSize: 0, // We don't have this info from the mock
						uploadType: 'profile',
						url: profileImageUrl,
						createdAt: now
					});
				}
				if (idDocumentUrl) {
					fileRecords.push({
						userId,
						filename: idDocumentUrl.split('/').pop() || 'id.pdf',
						originalName: 'id.pdf',
						fileType: 'application/pdf',
						fileSize: 0,
						uploadType: 'id',
						url: idDocumentUrl,
						createdAt: now
					});
				}
				if (guideLicenseUrl) {
					fileRecords.push({
						userId,
						filename: guideLicenseUrl.split('/').pop() || 'guide-license.pdf',
						originalName: 'guide-license.pdf',
						fileType: 'application/pdf',
						fileSize: 0,
						uploadType: 'guide',
						url: guideLicenseUrl,
						createdAt: now
					});
				}
				if (driverLicenseUrl) {
					fileRecords.push({
						userId,
						filename: driverLicenseUrl.split('/').pop() || 'driver-license.jpg',
						originalName: 'driver-license.jpg',
						fileType: 'image/jpeg',
						fileSize: 0,
						uploadType: 'driver',
						url: driverLicenseUrl,
						createdAt: now
					});
				}
				if (carInsuranceUrl) {
					fileRecords.push({
						userId,
						filename: carInsuranceUrl.split('/').pop() || 'car-insurance.pdf',
						originalName: 'car-insurance.pdf',
						fileType: 'application/pdf',
						fileSize: 0,
						uploadType: 'insurance',
						url: carInsuranceUrl,
						createdAt: now
					});
				}
				if (fileRecords.length > 0) {
					await db.insert(fileUploads).values(fileRecords);
				}
			} else if (role === 'traveler') {
				await db.insert(travelerProfiles).values({
					userId,
					nationality,
					travelStyle,
					budgetRange,
					preferredLanguages,
					travelFrequency,
					interests,
					dietaryRestrictions,
					accessibilityNeeds,
					emergencyContact,
					emergencyPhone,
					profileImageUrl,
					createdAt: now,
					updatedAt: now
				});

				// Create file upload record for traveler profile image
				if (profileImageUrl) {
					await db.insert(fileUploads).values({
						userId,
						filename: profileImageUrl.split('/').pop() || 'profile.jpg',
						originalName: 'profile.jpg',
						fileType: 'image/jpeg',
						fileSize: 0,
						uploadType: 'profile',
						url: profileImageUrl,
						createdAt: now
					});
				}
			}

			// Fetch the updated user
			const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));

			return json({ 
				success: true, 
				user: updatedUser,
				message: '가입이 완료되었습니다. 이메일 인증 링크를 확인해 주세요.',
				requiresEmailVerification: true
			});
		}

		return json({ 
			success: true, 
			user: result.user,
			message: '가입이 완료되었습니다. 이메일 인증 링크를 확인해 주세요.',
			requiresEmailVerification: true
		});
	} catch (e) {
		console.error('Signup exception:', e);

		// Handle specific better-auth errors
		if (e && typeof e === 'object' && 'body' in e) {
			const apiError = e as any;
			if (apiError.body?.code === 'USER_ALREADY_EXISTS') {
				return json(
					{
						success: false,
						error: '이미 등록된 이메일입니다. 다른 이메일을 사용해 주세요.'
					},
					{ status: 400 }
				);
			}
			if (apiError.body?.code === 'INVALID_EMAIL') {
				return json(
					{
						success: false,
						error: '유효하지 않은 이메일 형식입니다.'
					},
					{ status: 400 }
				);
			}
			if (apiError.body?.code === 'WEAK_PASSWORD') {
				return json(
					{
						success: false,
						error: '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해 주세요.'
					},
					{ status: 400 }
				);
			}
		}

		const message = e instanceof Error ? e.message : 'Unknown error';
		return json(
			{ success: false, error: '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.' },
			{ status: 500 }
		);
	}
}
