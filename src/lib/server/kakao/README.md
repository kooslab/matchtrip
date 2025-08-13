# Kakao AlimTalk Integration

## Quick Start

### Sending a Simple Message

```typescript
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import { prepareTemplate } from '$lib/server/kakao/templateHelper';

// Prepare template with variables
const prepared = prepareTemplate('testcode01', {
  SHOPNAME: '매치트립',
  NAME: '홍길동'
});

// Send the message
const result = await kakaoAlimTalk.sendAlimTalk({
  to: '821012345678',
  templateCode: 'testcode01',
  text: prepared.text,
  buttons: prepared.button ? [prepared.button] : undefined
});
```

### Available Templates

All templates are defined in `templates.json`. Use the helper functions to work with them:

```typescript
import { getAvailableTemplates, getTemplateInfo } from '$lib/server/kakao/templateHelper';

// Get all available template codes
const templates = getAvailableTemplates('dev'); // or 'prod'

// Get info about a specific template
const info = getTemplateInfo('testcode01');
console.log(info);
// {
//   code: 'testcode01',
//   name: 'signup01',
//   description: '회원가입 - 여행자',
//   variables: ['SHOPNAME', 'NAME'],
//   hasButton: true,
//   buttonName: '나의프로필보기'
// }
```

### Validate Template Data

Before sending, validate that all required variables are provided:

```typescript
import { validateTemplateData } from '$lib/server/kakao/templateHelper';

const validation = validateTemplateData('testcode01', {
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
await sendSignupNotification('testcode01', userName, phoneNumber);

// For guides  
await sendSignupNotification('testcode02', userName, phoneNumber);
```

### 2. Trip Creation Confirmation

```typescript
const prepared = prepareTemplate('testcode03', {
  SHOPNAME: '매치트립',
  NAME: userName
});

await kakaoAlimTalk.sendAlimTalk({
  to: phoneNumber,
  templateCode: 'testcode03',
  text: prepared.text,
  buttons: prepared.button ? [prepared.button] : undefined
});
```

### 3. New Message Alert

```typescript
// To customer when guide responds
const prepared = prepareTemplate('testcode05', {
  SHOPNAME: '매치트립',
  가이드: guideName,
  메세지확인하기: '메세지확인하기'
});

// To guide when customer sends message
const prepared = prepareTemplate('testcode10', {
  SHOPNAME: '매치트립',
  고객: customerName,
  메세지확인하기: '메세지확인하기'
});
```

## Template Codes Reference

| Code | Name | Description | Variables |
|------|------|-------------|-----------|
| testcode01 | signup01 | 회원가입 - 여행자 | SHOPNAME, NAME |
| testcode02 | signup02 | 회원가입 - 가이드 | SHOPNAME, NAME |
| testcode03 | mytrip01 | 여행 의뢰 등록 완료 | SHOPNAME, NAME |
| testcode04 | mytrip02 | 여행 제안 도착 알림 | SHOPNAME, 가이드, 나의여행 |
| testcode05 | chat01 | 가이드 답변 도착 | SHOPNAME, 가이드, 메세지확인하기 |
| testcode06 | settlement01 | 결제 완료 | SHOPNAME, 고객, 여행총결제금액 |
| testcode07 | remind01 | 여행 시작 리마인더 - 고객 | SHOPNAME, 가이드, 나의여행 |
| testcode08 | cs01 | 문의 등록 완료 | SHOPNAME, NAME |
| testcode09 | myoffers01 | 여행 제안 등록 완료 | SHOPNAME, NAME |
| testcode10 | chat02 | 고객 문의 도착 | SHOPNAME, 고객, 메세지확인하기 |
| testcode11 | myoffers02 | 제안 채택 알림 | SHOPNAME, 고객, 가이드, 나의제안 |
| testcode12 | remind02 | 여행 시작 리마인더 - 가이드 | SHOPNAME, 고객, 나의제안 |

## Important Notes

1. **Template Registration**: All templates must be pre-registered and approved by Kakao
2. **Variable Replacement**: Variables are replaced server-side before sending
3. **Button Matching**: Button names and URLs must match exactly what was registered
4. **Error Handling**: 
   - `EC_INVALID_TEMPLATE` (7009): Template or button mismatch
   - `EC_INVALID_TEMPLATE_ARGS` (7008): Missing/invalid parameters

## Testing

Use `/test-kakao` page for testing messages with different templates and variables.