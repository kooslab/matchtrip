# Kakao AlimTalk Integration

## Quick Start

### Sending a Simple Message

```typescript
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import { prepareTemplate } from '$lib/server/kakao/templateHelper';

// Prepare template with variables using logical name
const prepared = prepareTemplate('signup01', {
	SHOPNAME: '매치트립',
	NAME: '홍길동'
});

// Send the message
const result = await kakaoAlimTalk.sendAlimTalk({
	to: '821012345678',
	templateCode: prepared.templateCode, // Will be testcode01 in dev, code01 in prod
	text: prepared.text,
	buttons: prepared.button ? [prepared.button] : undefined
});
```

### Available Templates

All templates are defined in `templates.json`. Use the helper functions to work with them:

```typescript
import { getAvailableTemplates, getTemplateInfo } from '$lib/server/kakao/templateHelper';

// Get all available template names
const templates = getAvailableTemplates(); // Returns ['signup01', 'signup02', ...]

// Get info about a specific template
const info = getTemplateInfo('signup01');
console.log(info);
// {
//   name: 'signup01',
//   code: 'testcode01', // or 'code01' in production
//   description: '회원가입 - 여행자',
//   variables: ['SHOPNAME', 'NAME'],
//   hasButton: true,
//   buttonName: '나의프로필보기',
//   environment: 'dev' // or 'prod'
// }
```

### Validate Template Data

Before sending, validate that all required variables are provided:

```typescript
import { validateTemplateData } from '$lib/server/kakao/templateHelper';

const validation = validateTemplateData('signup01', {
	SHOPNAME: '매치트립'
	// Missing NAME variable
});

if (!validation.valid) {
	console.error('Missing variables:', validation.missing); // ['NAME']
}
```

## Common Use Cases

### 1. User Signup Notification

```typescript
// For travelers
await sendSignupNotification('signup01', userName, phoneNumber);

// For guides
await sendSignupNotification('signup02', userName, phoneNumber);
```

### 2. Trip Creation Confirmation

```typescript
const prepared = prepareTemplate('mytrip01', {
	SHOPNAME: '매치트립',
	NAME: userName
});

await kakaoAlimTalk.sendAlimTalk({
	to: phoneNumber,
	templateCode: prepared.templateCode,
	text: prepared.text,
	buttons: prepared.button ? [prepared.button] : undefined
});
```

### 3. New Message Alert

```typescript
// To customer when guide responds
const prepared = prepareTemplate('chat01', {
	SHOPNAME: '매치트립',
	가이드: guideName,
	메세지확인하기: '메세지확인하기'
});

// To guide when customer sends message
const prepared = prepareTemplate('chat02', {
	SHOPNAME: '매치트립',
	고객: customerName,
	메세지확인하기: '메세지확인하기'
});
```

## Template Reference

| Logical Name | Dev Code    | Prod Code | Description                 | Variables                        |
| ------------ | ----------- | --------- | --------------------------- | -------------------------------- |
| signup01     | testcode01  | code01    | 회원가입 - 여행자           | SHOPNAME, NAME                   |
| signup02     | testcode02  | code02    | 회원가입 - 가이드           | SHOPNAME, NAME                   |
| mytrip01     | testcode03  | code03    | 여행 의뢰 등록 완료         | SHOPNAME, NAME                   |
| mytrip02     | testcode04  | code04    | 여행 제안 도착 알림         | SHOPNAME, 가이드, 나의여행       |
| chat01       | testcode05  | code05    | 가이드 답변 도착            | SHOPNAME, 가이드, 메세지확인하기 |
| settlement01 | testcode06  | code06    | 결제 완료                   | SHOPNAME, 고객, 여행총결제금액   |
| remind01     | testcode07  | code07    | 여행 시작 리마인더 - 고객   | SHOPNAME, 가이드, 나의여행       |
| cs01         | testcode08  | code08    | 문의 등록 완료              | SHOPNAME, NAME                   |
| myoffers01   | testcode09  | code09    | 여행 제안 등록 완료         | SHOPNAME, NAME                   |
| chat02       | testcode10  | code10    | 고객 문의 도착              | SHOPNAME, 고객, 메세지확인하기   |
| myoffers02   | testcode11  | code11    | 제안 채택 알림              | SHOPNAME, 고객, 가이드, 나의제안 |
| remind02     | testcode12  | code12    | 여행 시작 리마인더 - 가이드 | SHOPNAME, 고객, 나의제안         |
| rqcancel01   | testcode13  | code13    | 취소요청 - 고객이 요청      | SHOPNAME, 고객, 주문내역         |
| rqcancel02   | testcode14  | code14    | 취소요청 - 고객이 요청 (가이드에게) | SHOPNAME, 고객, 나의제안  |
| rqcancel03   | testcode15  | code15    | 취소요청 - 가이드가 요청    | SHOPNAME, 가이드님, 나의제안     |
| rqcancel04   | testcode16  | code16    | 취소요청 - 가이드가 요청 (고객에게) | SHOPNAME, 가이드, 주문내역 |
| cpcancel01   | testcode17  | code17    | 취소완료 - 고객 취소 (고객에게) | SHOPNAME, 고객, 주문내역     |
| cpcancel02   | testcode18  | code18    | 취소완료 - 고객 취소 (가이드에게) | SHOPNAME, 고객, 나의제안   |
| cpcancel03   | testcode19  | code19    | 취소완료 - 가이드 취소 (가이드에게) | SHOPNAME, 가이드, 나의제안 |
| cpcancel04   | testcode20  | code20    | 취소완료 - 가이드 취소 (고객에게) | SHOPNAME, 가이드, 주문내역 |

## Important Notes

1. **Template Registration**: All templates must be pre-registered and approved by Kakao
2. **Variable Replacement**: Variables are replaced server-side before sending
3. **Button Matching**: Button names and URLs must match exactly what was registered
4. **Error Handling**:
   - `EC_INVALID_TEMPLATE` (7009): Template or button mismatch
   - `EC_INVALID_TEMPLATE_ARGS` (7008): Missing/invalid parameters

## Testing

Use `/test-kakao` page for testing messages with different templates and variables.
