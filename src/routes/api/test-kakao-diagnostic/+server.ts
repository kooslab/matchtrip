import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const diagnostics = {
		environment: {
			hasInfobipApiKey: !!env.INFOBIP_API_KEY,
			hasInfobipBaseUrl: !!env.INFOBIP_BASE_URL,
			hasKakaoChannelKey: !!env.KAKAO_CHANNEL_PROFILE_KEY,
			infobipBaseUrl: env.INFOBIP_BASE_URL || 'NOT_SET',
			kakaoChannelKey: env.KAKAO_CHANNEL_PROFILE_KEY || 'NOT_SET'
		},
		testCases: [
			{
				name: 'Template with variables',
				template:
					'[#{SHOPNAME}], 안녕하세요. #{NAME}님! #{SHOPNAME}에 회원가입 해주셔서 진심으로 감사드립니다!',
				variables: { SHOPNAME: '매치트립', NAME: '홍길동' },
				expected:
					'[매치트립], 안녕하세요. 홍길동님! 매치트립에 회원가입 해주셔서 진심으로 감사드립니다!'
			},
			{
				name: 'Simple template without variables',
				template: '안녕하세요. 회원가입을 환영합니다!',
				variables: {},
				expected: '안녕하세요. 회원가입을 환영합니다!'
			}
		],
		suggestions: [
			'1. Verify template code "testcode21" is approved in Infobip dashboard',
			'2. Check if the sender profile key matches the one used for template registration',
			'3. Ensure the exact text (after substitution) matches the registered template',
			'4. Try sending without any Korean characters first to test basic connectivity',
			'5. Contact Infobip support to verify template status'
		],
		commonIssues: {
			EC_INVALID_TEMPLATE: {
				description: 'Template error - template not found or not approved',
				possibleCauses: [
					'Template code does not exist',
					'Template is pending approval',
					'Template was rejected',
					'Sender profile does not have access to this template',
					'Text does not match registered template exactly (including spaces, punctuation)',
					'Template variables not properly substituted'
				]
			}
		}
	};

	// Test template substitution
	diagnostics.testCases = diagnostics.testCases.map((testCase) => {
		let result = testCase.template;
		for (const [key, value] of Object.entries(testCase.variables)) {
			result = result.replace(new RegExp(`#\\{${key}\\}`, 'g'), value);
		}
		return {
			...testCase,
			actual: result,
			passed: result === testCase.expected
		};
	});

	return json(diagnostics);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { templateCode } = await request.json();

		if (!env.INFOBIP_API_KEY || !env.INFOBIP_BASE_URL) {
			return json({ error: 'Infobip credentials not configured' }, { status: 500 });
		}

		// Try to get template information from Infobip (if such endpoint exists)
		// Note: This endpoint might not exist, but we're trying to help diagnose
		const headers = {
			Authorization: `App ${env.INFOBIP_API_KEY}`,
			Accept: 'application/json'
		};

		// Attempt to check template status
		const checkUrl = `${env.INFOBIP_BASE_URL}/kakao-alim/1/templates/${templateCode}`;

		try {
			const response = await fetch(checkUrl, {
				method: 'GET',
				headers
			});

			if (response.ok) {
				const data = await response.json();
				return json({
					templateExists: true,
					templateInfo: data
				});
			} else if (response.status === 404) {
				return json({
					templateExists: false,
					message: `Template "${templateCode}" not found`,
					suggestion: 'Please check if the template code is correct and has been registered'
				});
			} else {
				const errorData = await response.text();
				return json({
					templateCheckFailed: true,
					status: response.status,
					error: errorData,
					message: 'Could not verify template status'
				});
			}
		} catch (fetchError) {
			return json({
				message: 'Template verification endpoint not available',
				suggestion: 'Please check template status in Infobip dashboard manually',
				technicalNote: 'The template verification endpoint might not be publicly available'
			});
		}
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : 'Diagnostic check failed'
			},
			{ status: 500 }
		);
	}
};
