/**
 * FLock API Configuration
 * 
 * Setup Instructions:
 * 1. Go to https://platform.flock.io
 * 2. Sign up and create an API key
 * 3. Add your API key here or set VITE_FLOCK_API_KEY environment variable
 * 4. Buy credits if needed (Settings > Billing)
 */

export const FLOCK_CONFIG = {
  // API 키는 환경 변수에서 가져오거나 여기에 직접 설정
  // 보안을 위해 환경 변수 사용 권장
  API_KEY: import.meta.env.VITE_FLOCK_API_KEY || null,
  
  // API 엔드포인트 (FLock 문서 확인 필요)
  API_BASE_URL: 'https://api.flock.io/v1',
  
  // 사용할 모델 (FLock에서 제공하는 모델 선택)
  // API 키에 따라 사용 가능한 모델이 다를 수 있음
  MODEL: 'qwen3-235b-a22b-thinking-2507', // FLock 전용 모델 (API 키에 따라 변경 필요)
  
  // API 호출 타임아웃 (ms)
  TIMEOUT: 10000,
  
  // 자동 선택 활성화 여부
  ENABLED: true,
  
  // API 실패 시 폴백 전략
  FALLBACK_STRATEGY: 'smart', // 'smart' | 'random'
};

