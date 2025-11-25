# 🚀 Base Galaga MiniApp 배포 가이드

Base MiniApp으로 배포하기 위한 단계별 가이드입니다.

## 📋 필수 조건

- Base 앱 계정 (Farcaster 계정)
- Vercel 계정 (무료 계정 가능)
- GitHub 계정

## 🚀 배포 단계

### 1. GitHub 저장소 생성 및 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit: Base Galaga MiniApp"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/<your-username>/base-galaga-miniapp.git
git branch -M main
git push -u origin main
```

### 2. Vercel에 배포

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. "Deploy" 클릭

### 3. 환경 변수 설정 (선택사항)

Vercel 대시보드에서:
- Settings → Environment Variables
- `VERCEL_URL`은 자동으로 설정됨

### 4. 배포 보호 해제

Vercel 대시보드에서:
- Settings → Deployment Protection
- "Vercel Authentication" 끄기
- 저장

### 5. 매니페스트 서명 및 계정 연결

1. [Base Build Account Association Tool](https://build.base.org/account-association) 접속
2. Vercel 배포 URL 입력 (예: `your-app.vercel.app`)
3. "Submit" 클릭
4. "Sign Manifest" 버튼 클릭
5. 지시에 따라 Farcaster 계정으로 서명
6. 생성된 `accountAssociation` 객체 복사:
   ```json
   {
     "header": "...",
     "payload": "...",
     "signature": "..."
   }
   ```

### 6. `minikit.config.ts` 업데이트

복사한 `accountAssociation` 객체를 `minikit.config.ts`에 추가:

```typescript
export const minikitConfig = {
  accountAssociation: {
    "header": "여기에_복사한_header",
    "payload": "여기에_복사한_payload",
    "signature": "여기에_복사한_signature"
  },
  miniapp: {
    // ... 기존 설정
  },
} as const;
```

### 7. 변경사항 푸시 및 재배포

```bash
git add minikit.config.ts
git commit -m "Add account association credentials"
git push
```

Vercel이 자동으로 재배포합니다.

### 8. 앱 미리보기 및 검증

1. [base.dev/preview](https://base.dev/preview) 접속
2. 앱 URL 입력 (Vercel 배포 URL)
3. "Run" 버튼 클릭하여 앱 실행 확인
4. "Account Association" 탭에서 연결 확인
5. "Metadata" 탭에서 매니페스트 확인

### 9. Base 앱에 게시

1. Base 앱 열기
2. 새 포스트 작성
3. 앱 URL 포함 (예: `Check out Base Galaga: https://your-app.vercel.app`)
4. 게시

## 📝 필요한 이미지 파일

다음 이미지 파일들을 `public/` 폴더에 추가해야 합니다:

- `icon.png` - 앱 아이콘 (512x512 권장)
- `splash.png` - 스플래시 이미지 (1200x1600 권장)
- `hero.png` - 히어로 이미지 (1200x600 권장)
- `og-image.png` - Open Graph 이미지 (1200x630 권장)
- `screenshot-portrait.png` - 스크린샷 (세로형, 1080x1920 권장)

## 🔧 문제 해결

### 매니페스트가 생성되지 않는 경우

```bash
npm run generate-manifest
```

수동으로 실행하여 확인하세요.

### 배포 후 404 에러

- Vercel의 `vercel.json` 설정 확인
- `.well-known/farcaster.json` 파일이 `dist/` 폴더에 있는지 확인

### 계정 연결 실패

- `accountAssociation` 객체가 올바르게 설정되었는지 확인
- Vercel 배포 보호가 해제되었는지 확인
- Base Build Tool에서 다시 시도

## 📚 참고 자료

- [Base MiniApp 문서](https://docs.base.org/mini-apps)
- [Base Build Tool](https://build.base.org)
- [Vercel 문서](https://vercel.com/docs)
