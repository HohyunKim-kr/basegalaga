# 보안 가이드

## API 키 보안

### ⚠️ 현재 문제점

`VITE_` 접두사가 붙은 환경 변수는 Vite에서 **클라이언트 사이드 번들에 포함**되어 브라우저에서 노출됩니다.

```javascript
// ❌ 위험: API 키가 브라우저에 노출됨
import.meta.env.VITE_FLOCK_API_KEY  // 누구나 볼 수 있음!
```

### ✅ 해결 방법: 서버 사이드 API 사용

1. **Vercel 환경 변수 설정**
   - Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
   - `FLOCK_API_KEY` 추가 (⚠️ `VITE_` 접두사 없이!)
   - Production, Preview, Development 모두에 설정

2. **서버리스 함수 사용**
   - `/api/flock-select.js` 파일이 자동으로 서버 사이드에서 실행됨
   - API 키는 서버에서만 접근 가능
   - 클라이언트는 API 키를 볼 수 없음

3. **로컬 개발 환경**
   ```bash
   # .env.local 파일 생성 (Git에 커밋하지 않음)
   FLOCK_API_KEY=your_actual_api_key_here
   ```

### 📝 설정 단계

1. **Vercel 환경 변수 추가**
   ```
   FLOCK_API_KEY=sk-LsI6FNztgWJtlb84otMeYA
   ```

2. **.env 파일에서 VITE_ 접두사 제거** (또는 삭제)
   ```bash
   # .env 파일 수정
   # VITE_FLOCK_API_KEY=...  ← 이 줄 삭제 또는 주석 처리
   ```

3. **로컬 개발용 .env.local 생성**
   ```bash
   # .env.local (Git에 커밋하지 않음)
   FLOCK_API_KEY=your_actual_api_key_here
   ```

### 🔒 보안 체크리스트

- [ ] `.env` 파일에서 `VITE_FLOCK_API_KEY` 제거
- [ ] Vercel에 `FLOCK_API_KEY` 환경 변수 추가
- [ ] `.env.local` 파일 생성 (로컬 개발용)
- [ ] `.gitignore`에 `.env.local` 추가 확인
- [ ] 브라우저에서 `import.meta.env`에 API 키가 없는지 확인

### 🧪 테스트

브라우저 콘솔에서 확인:
```javascript
// ❌ 이렇게 나오면 안됨
import.meta.env.VITE_FLOCK_API_KEY  // "sk-..."

// ✅ 이렇게 나와야 함
import.meta.env.VITE_FLOCK_API_KEY  // undefined
```

