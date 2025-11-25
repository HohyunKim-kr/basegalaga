# 🚀 Base Galaga MiniApp

Base MiniApp SDK를 사용해 제작한 모바일 슈팅 게임(갤러그 스타일)입니다.
게임은 100% 클라이언트에서 실행되며, MiniApp SDK는 로그인·점수 관리·Farcaster 공유·리더보드 표시 등에 사용됩니다.

## 📱 Features

### Base MiniApp SDK 통합
- 지갑 로그인 (`mini.auth.connect`)
- 로컬 점수 저장 (`mini.storage`)
- Farcaster 공유 (`mini.social`)

### 게임 플레이 (Galaga-like Shooter)
- Canvas/Phaser 기반 2D 슈팅 게임
- 플레이어 조작, 적 생성, 충돌 판정, 점수 계산 포함

### Leaderboard
- 기기 로컬 저장 + 선택적으로 커뮤니티 공유

### UI 화면 구성
- 메인 화면
- 게임 화면
- 게임 종료 화면
- Leaderboard 화면

## 🧱 Project Structure

```
/src
 │── main.js                 # MiniApp SDK 초기화 + 화면 전환
 │── scenes/
 │     ├── MainMenu.js       # 메인 화면 (게임 시작, 리더보드 버튼)
 │     ├── GameScene.js      # 실제 게임 플레이
 │     ├── GameOver.js       # 점수 표시 + 공유 버튼
 │     └── Leaderboard.js    # 최고 점수 리스트
 │
 │── utils/
 │     ├── storage.js        # mini.storage 래퍼
 │     └── score.js          # 점수 정렬, 랭킹 계산
 │
 └── assets/                 # 이미지/사운드 (향후 추가)
```

## 🏁 Flow (전체 흐름)

### 1. 앱 실행
- Base MiniApp SDK 초기화
- 지갑 연결 (옵션, 게임 시작 시에도 가능)

### 2. 메인 화면 (Main Menu)
- "게임 시작" 버튼 → GameScene 이동
- "Leaderboard" 버튼 → Leaderboard 화면 이동

### 3. 게임 화면 (GameScene)
- 플레이어 조작 (좌/우 이동, 스페이스로 공격)
- 적 활동·충돌 처리·점수 증가
- 사망 시 GameOver 화면으로 이동

### 4. 게임 종료 화면 (GameOver)
- 이번 점수 표시
- 로컬 최고 점수 갱신 (`mini.storage.set`)
- 버튼:
  - 다시하기
  - Leaderboard 보기
  - Farcaster 공유 ("내 점수 자랑하기")

### 5. Leaderboard 화면
- 로컬 최고 점수 정렬
- (향후) 외부 API/온체인 랭킹 연동 가능

## 🛠 Tech Stack

- **Vite** — 개발/번들링
- **Phaser.js** — 2D 슈팅 게임 엔진
- **Base MiniApp SDK** — 로그인, 스토리지, 공유 기능
- **HTML Canvas** — 게임 렌더링
- **JavaScript (ES Modules)**

## 🔧 Base MiniApp SDK Integration

### SDK Ready 이벤트
```javascript
import { mini } from "@base/miniapp-sdk";

mini.onReady(() => {
  console.log("MiniApp loaded");
});
```

### 지갑 로그인
```javascript
const user = await mini.auth.connect();
console.log("Wallet:", user.address);
```

### 점수 저장
```javascript
await mini.storage.set("bestScore", score);
```

### 점수 불러오기
```javascript
const best = await mini.storage.get("bestScore");
```

### Farcaster 공유
```javascript
await mini.social.share({
  text: `내 점수는 ${score}점! Base Galaga 도전해보세요 🚀`
});
```

## 🏆 Leaderboard Logic (단순 로컬 버전)

게임 종료 시 현재 점수 저장

기존 점수 배열 불러오기

새로운 점수 push

높은 점수순 정렬

상위 20개만 유지

```javascript
let scores = await mini.storage.get("scores") || [];
scores.push({
  score,
  timestamp: Date.now()
});
scores.sort((a, b) => b.score - a.score);
await mini.storage.set("scores", scores.slice(0, 20));
```

## ▶️ Development

```bash
npm install
npm run dev
```

로컬 서버 실행 후 MiniApp 미리보기에서 URL을 연결해 테스트합니다.

## 🚢 Deployment

Base 공식 문서에 따른 배포 단계를 따르세요: [Create a Mini App](https://docs.base.org/mini-apps/quickstart/create-new-miniapp)

### 1. Vercel에 배포

#### 옵션 A: GitHub 연동
1. 이 프로젝트를 GitHub에 푸시
2. [Vercel](https://vercel.com)에 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택
5. 프로젝트 설정:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. "Deploy" 클릭

#### 옵션 B: Vercel CLI
```bash
npm i -g vercel
vercel
```

### 2. Manifest 구성 업데이트

`minikit.config.ts` 파일을 수정하여 앱 정보를 업데이트하세요:

```typescript
export const minikitConfig = {
  accountAssociation: {
    // Step 5에서 추가됩니다
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "Base Galaga",
    subtitle: "Galaga-style Shooter MiniApp",
    description: "A classic Galaga-style shooter game...",
    // ROOT_URL은 배포 후 자동으로 설정됩니다
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    // ... 기타 설정
  },
}
```

### 3. Account Association 자격 증명 생성

1. **변경사항 배포**: 모든 변경사항을 `main` 브랜치에 푸시하여 Vercel에 배포
2. **Vercel 배포 보호 해제**: 
   - Vercel 대시보드 → Settings → Deployment Protection
   - "Vercel Authentication" 끄기 → 저장
3. **Base Build 도구 접속**: [Account association tool](https://www.base.dev/preview?tab=account)
4. **도메인 입력**: 앱 URL (예: `your-app.vercel.app`) 입력 후 "Submit"
5. **매니페스트 서명**: "Verify" 버튼 클릭 후 지시에 따라 `accountAssociation` 필드 생성
6. **자격 증명 복사**: 생성된 `accountAssociation` 객체 복사

### 4. `minikit.config.ts` 업데이트

복사한 `accountAssociation` 객체를 `minikit.config.ts`에 추가:

```typescript
export const minikitConfig = {
  accountAssociation: {
    "header": "eyJmaBBiOjE3MzE4LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4NzYwQjA0NDc5NjM4MTExNzNmRjg3YDPBYzA5OEJBQ0YxNzNCYkU0OCJ9",
    "payload": "eyJkb21haW4iOiJ4BWl0bGlzdC1xcy52ZXJjZWwuYXBwIn7",
    "signature": "MHhmNGQzN2M2OTk4NDIwZDNjZWVjYTNiODllYzJkMjAwOTkyMDEwOGVhNTFlYWI3NjAyN2QyMmM1MDVhNzIyMWY2NTRiYmRlZmQ0NGQwOWNiY2M2NmI2B7VmNGZiMmZiOGYzNDVjODVmNmQ3ZTVjNzI3OWNmMGY4ZTA2ODYzM2FjZjFi"
  },
  miniapp: {
    // ...
  },
}
```

### 5. 프로덕션에 업데이트 푸시

모든 변경사항을 `main` 브랜치에 푸시하면 Vercel이 자동으로 배포합니다.

### 6. 앱 미리보기

[base.dev/preview](https://base.dev/preview)에서 앱을 검증하세요:
- 앱 URL 추가 후 실행 버튼 클릭하여 앱 실행 확인
- "Account association" 탭에서 연결 자격 증명 확인
- "Metadata" 탭에서 매니페스트 메타데이터 확인

### 7. 게시

Base 앱에서 앱 URL을 포함한 포스트를 작성하여 앱을 게시하세요.

## 🎮 Screens (UI Flow)

```
[Main Menu]
   - Start Game
   - Leaderboard
         ↓
[Game Scene]
         ↓ (Game Over)
[Game Over Screen]
   - Score
   - Retry
   - Share to Farcaster
   - Leaderboard
         ↓
[Leaderboard Screen]
   - local best scores
   - back
```

## 🎮 Controls

- **← → Arrow Keys**: 플레이어 이동
- **Space**: 발사

## ✨ Roadmap

- [ ] Enemy 패턴 추가
- [ ] 기기 간 Leaderboard 연동 (옵션)
- [ ] 스킨/테마 추가
- [ ] 사운드 효과 업그레이드
- [ ] 난이도 곡선 조정
- [ ] 파워업 아이템 추가
- [ ] 보스 전투 추가

## 📄 License

MIT

