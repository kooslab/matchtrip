import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { TRAVEL_STYLES, ACTIVITY_TYPES } from '$lib/constants/travel';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		// Check if API key exists
		if (!env.LLM_API_KEY_OPENAI) {
			console.error('OpenAI API key not configured');
			return json({ error: 'AI service not configured' }, { status: 500 });
		}

		// Extract all trip details
		const {
			destination,
			destinationId,
			startDate,
			endDate,
			adultsCount,
			childrenCount,
			babiesCount,
			budget,
			travelStyle,
			activities,
			customRequest,
			additionalRequest
		} = data;

		// Format destination string
		let destinationString = '미정';
		if (destination) {
			if (typeof destination === 'object' && destination.city && destination.country) {
				destinationString = `${destination.city}, ${destination.country}`;
			} else if (typeof destination === 'string') {
				destinationString = destination;
			}
		}

		// Calculate trip duration
		let duration = 1;
		let dateString = '날짜 미정';
		if (startDate && endDate) {
			const start = new Date(startDate);
			const end = new Date(endDate);
			duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
			dateString = `${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')}`;
		}

		// Build detailed traveler info
		const totalTravelers = (adultsCount || 1) + (childrenCount || 0) + (babiesCount || 0);
		let travelerInfo = `총 ${totalTravelers}명 (`;
		const travelerDetails = [];
		if (adultsCount > 0) travelerDetails.push(`성인 ${adultsCount}명`);
		if (childrenCount > 0) travelerDetails.push(`어린이 ${childrenCount}명`);
		if (babiesCount > 0) travelerDetails.push(`유아 ${babiesCount}명`);
		travelerInfo += travelerDetails.join(', ') + ')';

		// Format budget info
		let budgetInfo = '미정';
		if (budget) {
			if (budget.min && budget.max) {
				budgetInfo = `${budget.min.toLocaleString('ko-KR')}원 - ${budget.max.toLocaleString('ko-KR')}원`;
			} else {
				budgetInfo = budget.name || '미정';
			}
		}

		// Format travel style
		const travelStyleName = travelStyle
			? TRAVEL_STYLES[travelStyle.id] || travelStyle.name || '미정'
			: '미정';

		// Format activities with Korean names
		const activityNames =
			activities && activities.length > 0
				? activities.map((act) => ACTIVITY_TYPES[act] || act).join(', ')
				: '다양한 활동';

		// Include existing requests if any
		const existingRequests = customRequest || additionalRequest || '';

		// Create comprehensive prompt for OpenAI
		const prompt = `데이투어 기준으로 일정표를 만들려고해.

새로운 입력문구와 더불어
아래와 같은 조건으로 여행일정표를 만들어줘.

여행 정보:
목적지: ${destinationString}
여행 기간: ${duration}일 (${dateString})
여행 인원: ${travelerInfo}
예산: ${budgetInfo}
여행 스타일: ${travelStyleName}
선호 활동: ${activityNames}
${existingRequests ? `기존 요청사항: ${existingRequests}` : ''}

조건:
- 현지 여행지명은 한국어,영어 표기법이 아니라, 현지에서 사용되는 언어표기법을 써주고 한국어로 지명을 알려줘. (예를들면 독일 베를린 Bundestag, 국회의사당)
- 여행지명의 간단한 유래를 20-30자내외로 설명해줘 (예를 들면, 브란덴브루크문은 18세기 평화의문으로 만들어진 곳입니다. 현재는 통일의문으로 불립니다.)
- 데이투어 내에서 이동시 도보 xx분, 대중교통 xx분으로 이동에 대한 자세한 내용을 알려줘.
- 마이리얼트립이나, 겟유어가이드 일정표를 참고해도 좋아.
- 맛집을 원할 경우, 구글에서 평점이 4.3이상 인곳을 추천해줘. 대략 점심시간이나 저녁일정이 있으면 센스있게 제안해줄래?

앞으로 모든 질문에는 위 조건에 맞게 제안해줘.`;

		// Call OpenAI API
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.LLM_API_KEY_OPENAI}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content:
							'당신은 데이투어 일정표를 만드는 여행 전문가입니다. 주어진 조건에 맞춰 구체적이고 실용적인 일정표를 작성합니다. 현지 언어 표기법을 사용하고, 장소의 유래를 간단히 설명하며, 이동 시간을 구체적으로 제시합니다. 일반 텍스트 형식으로만 작성하고, 마크다운이나 번호 목록을 사용하지 마세요.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.8,
				max_tokens: 1000
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('OpenAI API error:', error);
			return json({ error: 'Failed to generate AI request' }, { status: 500 });
		}

		const result = await response.json();
		const generatedRequest = result.choices[0]?.message?.content?.trim() || '';

		return json({ request: generatedRequest });
	} catch (error) {
		console.error('Error generating AI request:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
