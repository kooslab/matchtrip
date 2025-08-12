#!/usr/bin/env bun

// Test script for Kakao AlimTalk template substitution

const baseUrl = 'http://localhost:5173'; // Update this to your local dev server URL

async function testKakaoTemplate() {
	console.log('=== Testing Kakao AlimTalk Template ===\n');

	// Test data matching your template
	const testData = {
		to: '821030637950', // Your test phone number
		templateCode: 'testcode01',
		text: '[#{SHOPNAME}], 안녕하세요. #{NAME}님! #{SHOPNAME}에 회원가입 해주셔서 진심으로 감사드립니다!',
		templateData: {
			SHOPNAME: '매치트립',
			NAME: '홍길동'
		}
	};

	console.log('Request Data:');
	console.log(JSON.stringify(testData, null, 2));
	console.log('\nExpected substituted text:');
	console.log('[매치트립], 안녕하세요. 홍길동님! 매치트립에 회원가입 해주셔서 진심으로 감사드립니다!');
	console.log('\n---\n');

	try {
		const response = await fetch(`${baseUrl}/api/test-kakao`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(testData)
		});

		const result = await response.json();
		
		console.log('Response Status:', response.status);
		console.log('Response Body:');
		console.log(JSON.stringify(result, null, 2));

		if (result.success) {
			console.log('\n✅ Template test successful!');
			
			// Check the actual message status
			if (result.result?.results?.[0]) {
				const messageResult = result.result.results[0];
				console.log('\nMessage Status:', messageResult.status?.name);
				console.log('Message ID:', messageResult.messageId);
				
				if (messageResult.error) {
					console.log('\n❌ Message delivery error:');
					console.log('Error Name:', messageResult.error.name);
					console.log('Error Description:', messageResult.error.description);
				}
			}
		} else {
			console.log('\n❌ Template test failed!');
			console.log('Error:', result.error);
		}
	} catch (error) {
		console.error('\n❌ Request failed:', error);
	}
}

// Run the test
testKakaoTemplate();