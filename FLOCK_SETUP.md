# FLock API 통합 가이드

## 개요
Base Galaga 게임에서 FLock API를 사용하여 AI가 자동으로 최적의 아이템을 선택하도록 설정합니다.

## 설정 단계

### 1. FLock 플랫폼 가입 및 API 키 생성

1. **플랫폼 접속**
   - https://platform.flock.io 접속
   - 계정 생성 및 로그인

2. **API 키 생성**
   - 대시보드에서 "Create API key" 클릭
   - 사용할 모델 선택 (예: GPT-4, FLock 전용 모델)
   - API 키 생성 및 안전하게 보관
   - ⚠️ API 키는 다시 볼 수 없으므로 반드시 저장

3. **크레딧 구매** (필요 시)
   - Settings > Billing 메뉴
   - Stripe 또는 Base로 결제
   - API 사용량에 따라 크레딧 소모

### 2. 프로젝트 설정

#### 방법 1: 환경 변수 사용 (권장)

`.env` 파일 생성:
```bash
VITE_FLOCK_API_KEY=your_api_key_here
```

#### 방법 2: 코드에 직접 설정

`src/config/flockConfig.js` 파일 수정:
```javascript
export const FLOCK_CONFIG = {
  API_KEY: 'your_api_key_here', // 여기에 직접 입력
  // ...
};
```

#### 방법 3: 런타임 설정

게임 실행 중 localStorage에 저장:
```javascript
localStorage.setItem('FLOCK_API_KEY', 'your_api_key_here');
```

### 3. API 엔드포인트 확인

FLock API 문서에서 실제 엔드포인트 확인:
- https://docs.flock.io/flock-products/api-platform/api-endpoint

현재 코드는 일반적인 OpenAI 형식을 가정하고 있습니다. FLock의 실제 엔드포인트에 맞게 수정이 필요할 수 있습니다.

### 4. 사용량 추적

- 플랫폼의 Usage 탭에서 확인:
  - 총 요청 수
  - 총 토큰 사용량
  - 요청당 평균 비용

## 작동 방식

1. **스테이지 클리어 시**
   - 3개의 랜덤 아이템 생성
   - 게임 상태 수집 (체력, 스테이지, 무기 등)

2. **AI 분석**
   - FLock API에 게임 상태와 아이템 정보 전송
   - AI가 최적의 선택 분석
   - 응답에서 선택된 아이템 번호 파싱

3. **자동 선택**
   - 선택된 아이템 하이라이트
   - 1초 후 자동으로 아이템 적용
   - 게임 계속 진행

## AI 선택 전략

AI는 다음 요소를 고려하여 선택합니다:

- **체력이 낮을 때**: HEALTH RESTORE 우선
- **체력이 충분할 때**: WEAPON UPGRADE 또는 FIRE RATE BOOST
- **장기 생존**: MAX HEALTH UP
- **고득점**: SCORE MULTIPLIER

## 문제 해결

### API 키 오류
- API 키가 올바른지 확인
- 환경 변수가 제대로 로드되는지 확인
- 브라우저 콘솔에서 에러 확인

### API 호출 실패
- 네트워크 연결 확인
- FLock 플랫폼 상태 확인
- 크레딧 잔액 확인
- 자동으로 폴백 전략 사용 (스마트 선택 또는 랜덤)

### 응답 파싱 오류
- AI 응답 형식 확인
- `FlockAPIService.js`의 `parseSelection` 메서드 수정 필요할 수 있음

## 비용 관리

- API 사용량 모니터링
- 필요 시 크레딧 추가 구매
- 사용량이 많으면 비용 최적화 고려

## 수동 선택으로 전환

AI 선택을 비활성화하려면:

```javascript
// src/config/flockConfig.js
export const FLOCK_CONFIG = {
  ENABLED: false, // false로 변경
  // ...
};
```

또는 게임 실행 중:
```javascript
this.useAISelection = false;
```

## 추가 정보

- FLock 문서: https://docs.flock.io
- 플랫폼: https://platform.flock.io
- API 엔드포인트 문서: https://docs.flock.io/flock-products/api-platform/api-endpoint

