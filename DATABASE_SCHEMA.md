# 데이터베이스 스키마 문서

## MatchTrip - 여행자와 가이드 매칭 플랫폼

> 이 문서는 디자이너를 위한 데이터 구조 및 관계 설명서입니다.

---

## 📋 목차

1. [플랫폼 개요](#플랫폼-개요)
2. [핵심 테이블 구조](#핵심-테이블-구조)
3. [사용자 관리 시스템](#사용자-관리-시스템)
4. [여행 및 매칭 시스템](#여행-및-매칭-시스템)
5. [결제 시스템](#결제-시스템)
6. [데이터 관계도](#데이터-관계도)

---

## 플랫폼 개요

**MatchTrip**은 여행자와 현지 가이드를 연결하는 플랫폼입니다. 여행자는 원하는 목적지와 일정을 등록하고, 가이드들이 맞춤형 투어 제안을 제공하는 시스템입니다.

### 주요 사용자 유형

- **여행자 (Traveler)**: 여행 계획을 세우고 가이드 서비스를 찾는 사용자
- **가이드 (Guide)**: 현지 전문 지식을 제공하고 투어 서비스를 제공하는 사용자
- **관리자 (Admin)**: 플랫폼을 관리하는 운영진

---

## 핵심 테이블 구조

### 1. 사용자 관리 시스템

#### 🔸 `users` (사용자 기본 정보)

**목적**: 모든 사용자의 기본 정보를 저장하는 중심 테이블

| 필드명          | 타입    | 설명                               | 디자인 고려사항           |
| --------------- | ------- | ---------------------------------- | ------------------------- |
| `id`            | UUID    | 고유 식별자                        | -                         |
| `name`          | TEXT    | 사용자 이름                        | 프로필에 표시될 주요 정보 |
| `email`         | TEXT    | 이메일 (고유)                      | 로그인 ID로 사용          |
| `emailVerified` | BOOLEAN | 이메일 인증 여부                   | 인증 배지 표시 고려       |
| `image`         | TEXT    | 프로필 이미지 URL                  | 아바타 이미지             |
| `role`          | ENUM    | 사용자 역할 (traveler/guide/admin) | 역할별 UI 차별화 필요     |
| `phone`         | TEXT    | 전화번호                           | 선택적 정보               |
| `birthDate`     | DATE    | 생년월일                           | 프라이버시 고려           |

#### 🔸 `guideProfiles` (가이드 상세 프로필)

**목적**: 가이드의 전문 정보와 서비스 영역을 저장

| 필드명            | 타입    | 설명             | 디자인 고려사항           |
| ----------------- | ------- | ---------------- | ------------------------- |
| `currentLocation` | TEXT    | 현재 위치        | 지도 표시 가능            |
| `guideAreas`      | TEXT    | 가이드 가능 지역 | 태그 형태로 표시          |
| `activityAreas`   | JSON    | 활동 분야 배열   | 카테고리 필터로 활용      |
| `experience`      | TEXT    | 경력 설명        | 긴 텍스트, 카드 형태 표시 |
| `languages`       | JSON    | 구사 언어 배열   | 언어 아이콘으로 표시      |
| `certifications`  | TEXT    | 자격증 정보      | 신뢰도 표시 요소          |
| `introduction`    | TEXT    | 자기소개         | 가이드 상세 페이지의 핵심 |
| `isVerified`      | BOOLEAN | 인증 여부        | 인증 배지/마크 필수       |
| `profileImageUrl` | TEXT    | 프로필 사진      | 고화질 이미지 필요        |

#### 🔸 `travelerProfiles` (여행자 상세 프로필)

**목적**: 여행자의 선호도와 여행 스타일 정보를 저장

| 필드명                | 타입 | 설명            | 디자인 고려사항      |
| --------------------- | ---- | --------------- | -------------------- |
| `nationality`         | TEXT | 국적            | 국기 아이콘 표시     |
| `travelStyle`         | TEXT | 여행 스타일     | 개성 표현 요소       |
| `budgetRange`         | TEXT | 예산 범위       | 가격대별 필터링      |
| `preferredLanguages`  | JSON | 선호 언어       | 가이드 매칭 시 중요  |
| `interests`           | JSON | 관심사 배열     | 태그 클라우드 형태   |
| `dietaryRestrictions` | JSON | 식이 제한       | 아이콘으로 간단 표시 |
| `accessibilityNeeds`  | TEXT | 접근성 요구사항 | 배리어프리 표시      |
| `emergencyContact`    | TEXT | 비상 연락처     | 보안 정보            |

### 2. 여행 및 매칭 시스템

#### 🔸 `destinations` (목적지)

**목적**: 여행 가능한 도시와 국가 정보

| 필드명    | 타입        | 설명   | 디자인 고려사항  |
| --------- | ----------- | ------ | ---------------- |
| `city`    | VARCHAR(50) | 도시명 | 검색 자동완성    |
| `country` | VARCHAR(50) | 국가명 | 국기와 함께 표시 |

#### 🔸 `trips` (여행 요청)

**목적**: 여행자가 등록한 여행 계획 정보

| 필드명          | 타입      | 설명                                                | 디자인 고려사항  |
| --------------- | --------- | --------------------------------------------------- | ---------------- |
| `userId`        | UUID      | 여행자 ID                                           | -                |
| `destinationId` | INTEGER   | 목적지 ID                                           | 지역 정보 표시   |
| `adultsCount`   | INTEGER   | 성인 수                                             | 인원 표시 아이콘 |
| `childrenCount` | INTEGER   | 어린이 수                                           | 가족 여행 표시   |
| `startDate`     | TIMESTAMP | 여행 시작일                                         | 캘린더 표시      |
| `endDate`       | TIMESTAMP | 여행 종료일                                         | 기간 계산 표시   |
| `travelMethod`  | ENUM      | 이동 수단                                           | 아이콘으로 표시  |
| `customRequest` | TEXT      | 특별 요청 사항                                      | 말풍선 형태      |
| `status`        | ENUM      | 상태 (draft/submitted/accepted/completed/cancelled) | 진행 단계 표시   |

**여행 수단 옵션 (TravelMethod)**:

- `walking` (도보)
- `driving` (자동차)
- `public_transport` (대중교통)
- `bike` (자전거)
- 복합 옵션들 (예: `walking+public_transport`)

#### 🔸 `offers` (가이드 제안)

**목적**: 가이드가 특정 여행에 대해 제안하는 서비스 내용

| 필드명            | 타입       | 설명                                            | 디자인 고려사항        |
| ----------------- | ---------- | ----------------------------------------------- | ---------------------- |
| `tripId`          | UUID       | 대상 여행 ID                                    | -                      |
| `guideId`         | UUID       | 제안하는 가이드 ID                              | 가이드 프로필 연결     |
| `travelerId`      | UUID       | 여행자 ID                                       | -                      |
| `title`           | TEXT       | 제안 제목                                       | 카드 제목으로 사용     |
| `description`     | TEXT       | 상세 설명                                       | 긴 텍스트, 접기/펼치기 |
| `price`           | INTEGER    | 가격 (센트 단위)                                | 통화 형식으로 표시     |
| `currency`        | VARCHAR(3) | 통화 (기본: USD)                                | 통화 기호 표시         |
| `duration`        | INTEGER    | 소요 시간 (시간)                                | 시계 아이콘            |
| `maxParticipants` | INTEGER    | 최대 참가자 수                                  | 인원 제한 표시         |
| `itinerary`       | TEXT       | 여행 일정                                       | 타임라인 형태          |
| `status`          | ENUM       | 제안 상태 (pending/accepted/rejected/withdrawn) | 상태별 색상 구분       |
| `validUntil`      | TIMESTAMP  | 제안 유효 기간                                  | 카운트다운 표시        |

### 3. 결제 시스템

#### 🔸 `payments` (결제 정보)

**목적**: 토스페이먼츠를 통한 결제 내역 관리

| 필드명          | 타입      | 설명            | 디자인 고려사항    |
| --------------- | --------- | --------------- | ------------------ |
| `tripId`        | UUID      | 여행 ID         | -                  |
| `offerId`       | UUID      | 제안 ID         | -                  |
| `userId`        | UUID      | 결제자 ID       | -                  |
| `amount`        | INTEGER   | 결제 금액 (KRW) | 원화 표시          |
| `paymentKey`    | TEXT      | 토스페이먼츠 키 | -                  |
| `orderId`       | TEXT      | 주문 ID         | 영수증 번호        |
| `status`        | ENUM      | 결제 상태       | 상태별 색상/아이콘 |
| `paymentMethod` | TEXT      | 결제 수단       | 카드사 로고 표시   |
| `paidAt`        | TIMESTAMP | 결제 완료 시간  | 영수증 정보        |

**결제 상태 (PaymentStatus)**:

- `pending` (대기 중)
- `processing` (처리 중)
- `completed` (완료)
- `failed` (실패)
- `cancelled` (취소)
- `refunded` (환불)

### 4. 시스템 관리 테이블

#### 🔸 `userAgreements` (사용자 약관 동의)

- 이용약관, 개인정보처리방침, 마케팅 동의 관리
- 법적 컴플라이언스를 위한 필수 테이블

#### 🔸 `fileUploads` (파일 업로드)

- 프로필 사진, 인증서류 등 업로드된 파일 관리
- Cloudflare R2 스토리지 연동

#### 🔸 `sessions` / `accounts` / `verifications`

- Better-auth 라이브러리를 통한 인증 시스템
- 소셜 로그인, 세션 관리, 이메일 인증

---

## 데이터 관계도

### 핵심 관계

1. **User → GuideProfile / TravelerProfile** (1:1)
   - 사용자 역할에 따른 확장 프로필

2. **User(Traveler) → Trip** (1:N)
   - 한 여행자가 여러 여행 계획 생성 가능

3. **Trip → Offer** (1:N)
   - 하나의 여행에 여러 가이드가 제안 가능

4. **User(Guide) → Offer** (1:N)
   - 한 가이드가 여러 여행에 제안 가능

5. **Offer → Payment** (1:1)
   - 승인된 제안에 대한 결제

### 상태 플로우

```
여행 요청: draft → submitted → accepted → completed/cancelled
제안: pending → accepted/rejected/withdrawn
결제: pending → processing → completed/failed/cancelled/refunded
```

---

## 디자인 고려사항

### 1. 사용자 인터페이스

- **역할별 대시보드**: 여행자/가이드/관리자별 다른 UI
- **상태 표시**: 진행 단계를 시각적으로 표현 (진행바, 배지)
- **신뢰도 표시**: 인증 마크, 평점, 리뷰 등

### 2. 데이터 시각화

- **지도 연동**: 목적지, 가이드 위치 표시
- **캘린더**: 여행 일정, 가이드 가능 시간
- **타임라인**: 여행 일정표, 진행 상황

### 3. 모바일 최적화

- 터치 친화적 인터페이스
- 위치 기반 서비스 활용
- 실시간 알림 시스템

### 4. 다국어 지원

- 언어별 콘텐츠 관리
- 현지화된 통화/날짜 형식
- 문화적 차이 고려

---

## 추가 기능 확장 가능성

- **리뷰/평점 시스템**: 여행 완료 후 상호 평가
- **즐겨찾기**: 관심 가이드/목적지 저장
- **알림 시스템**: 실시간 매칭 알림
- **채팅 시스템**: 가이드-여행자 실시간 소통
- **포인트/쿠폰**: 리워드 프로그램
- **그룹 여행**: 다수 여행자 매칭

---

> 이 문서는 개발 진행에 따라 지속적으로 업데이트될 예정입니다.
> 디자인 작업 시 궁금한 사항이 있으면 언제든 문의해 주세요!
