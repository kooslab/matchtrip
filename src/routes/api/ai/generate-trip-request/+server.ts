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
		const travelStyleName = travelStyle ? (TRAVEL_STYLES[travelStyle.id] || travelStyle.name || '미정') : '미정';

		// Format activities with Korean names
		const activityNames = activities && activities.length > 0 
			? activities.map(act => ACTIVITY_TYPES[act] || act).join(', ')
			: '다양한 활동';

		// Include existing requests if any
		const existingRequests = customRequest || additionalRequest || '';

		// Create comprehensive prompt for OpenAI
		const prompt = `다음 여행 정보를 바탕으로 맞춤형 여행 요청사항을 한국어로 작성해주세요. 300단어 이내로 작성하되, 일반 텍스트 형식으로 자연스럽게 작성해주세요. 마크다운이나 번호 목록을 사용하지 마세요.

여행 정보:
목적지: ${destinationString}
여행 기간: ${duration}일 (${dateString})
여행 인원: ${travelerInfo}
예산: ${budgetInfo}
여행 스타일: ${travelStyleName}
선호 활동: ${activityNames}
${existingRequests ? `기존 요청사항: ${existingRequests}` : ''}

다음 내용을 포함하여 자연스러운 문장으로 여행 요청사항을 작성해주세요:

여행자의 구성과 선호도를 고려한 일정 희망사항, 꼭 방문하고 싶은 장소나 체험하고 싶은 활동, 현지 음식이나 문화 체험에 대한 관심사, 가이드에게 특별히 도움받고 싶은 부분, 피하고 싶거나 주의해야 할 사항 등을 자연스럽게 연결하여 작성해주세요.

문단을 나누지 말고 하나의 연속된 텍스트로 작성하되, 여행에 대한 기대와 구체적인 요청사항이 잘 드러나도록 해주세요.`;

		// Call OpenAI API
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${env.LLM_API_KEY_OPENAI}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: '당신은 여행 계획을 도와주는 전문가입니다. 여행자의 정보를 바탕으로 구체적이고 개인화된 요청사항을 작성합니다. 일반 텍스트 형식으로만 작성하고, 마크다운, 번호 목록, 특수 문자를 사용하지 마세요.'
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