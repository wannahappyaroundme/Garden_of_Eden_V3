# 📦 Garden of Eden V3 - Distribution Files

이 폴더는 **빌드된 배포 파일**을 저장하는 곳입니다.

---

## 🚨 현재 상태: 빌드 이슈 있음

**빌드 차단 이유**: `better-sqlite3` 네이티브 모듈이 Electron 39.1.2와 호환되지 않습니다.

### 에러 상세
```
error: no member named 'GetIsolate' in 'v8::Context'
```

이는 Electron 39에서 V8 API가 변경되어 발생하는 문제입니다.

---

## 🔧 해결 방법

### Option 1: Electron 버전 다운그레이드 (권장)
```bash
npm install electron@28.0.0 --save-dev
npm run build:mac  # macOS
npm run build:win  # Windows
npm run build:linux  # Linux
```

### Option 2: better-sqlite3 업데이트
```bash
npm install better-sqlite3@latest --save
npm run build:native
npm run build:mac
```

### Option 3: 다른 데이터베이스 라이브러리 사용
- `sql.js` (WebAssembly 기반, 네이티브 모듈 불필요)
- `better-sqlite3` 대신 Prisma ORM 고려

---

## 📁 빌드 후 파일 구조

빌드가 성공하면 `release/` 폴더에 생성된 파일들을 이 폴더로 이동하세요:

```
program/
├── macOS/
│   ├── Garden-of-Eden-V3-{version}-arm64.dmg
│   ├── Garden-of-Eden-V3-{version}-arm64-mac.zip
│   └── latest-mac.yml
│
├── Windows/
│   ├── Garden-of-Eden-V3-Setup-{version}.exe (NSIS installer)
│   ├── Garden-of-Eden-V3-{version}.exe (Portable)
│   └── latest.yml
│
├── Linux/
│   ├── Garden-of-Eden-V3-{version}.AppImage
│   ├── Garden-of-Eden-V3_{version}_amd64.deb
│   └── latest-linux.yml
│
└── checksums/
    └── SHA256SUMS.txt
```

---

## 🏗️ 빌드 명령어 (이슈 해결 후)

### 전체 빌드 프로세스

1. **Type Check**
   ```bash
   npm run type-check
   ```

2. **Lint**
   ```bash
   npm run lint
   ```

3. **TypeScript 빌드**
   ```bash
   npm run build:electron
   ```

4. **플랫폼별 빌드**
   ```bash
   # macOS (must run on macOS)
   npm run build:mac

   # Windows (can run on any platform)
   npm run build:win

   # Linux
   npm run build:linux
   ```

5. **파일 이동**
   ```bash
   # macOS
   mkdir -p program/macOS
   cp release/*.dmg release/*.zip release/latest-mac.yml program/macOS/

   # Windows
   mkdir -p program/Windows
   cp release/*.exe release/latest.yml program/Windows/

   # Linux
   mkdir -p program/Linux
   cp release/*.AppImage release/*.deb release/latest-linux.yml program/Linux/
   ```

6. **Checksums 생성**
   ```bash
   cd program
   shasum -a 256 macOS/*.dmg macOS/*.zip Windows/*.exe Linux/*.AppImage Linux/*.deb > checksums/SHA256SUMS.txt
   ```

---

## 📊 예상 파일 크기

| 플랫폼 | 파일 | 크기 |
|-------|------|------|
| **macOS** | DMG | ~150-200MB |
| **macOS** | ZIP | ~140-190MB |
| **Windows** | NSIS Installer | ~150-200MB |
| **Windows** | Portable | ~140-190MB |
| **Linux** | AppImage | ~150-200MB |
| **Linux** | deb | ~140-190MB |

**⚠️ 참고**: AI 모델 (12GB)은 포함되지 않으며, 사용자가 첫 실행 시 다운로드합니다.

---

## 🔐 Code Signing (선택사항)

### macOS
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
npm run build:mac
```

### Windows
```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
npm run build:win
```

---

## 🚀 GitHub Release에 업로드

```bash
# GitHub CLI 사용
gh release create v1.0.0 \
  --title "Garden of Eden V3 v1.0.0" \
  --notes "See CHANGELOG.md for details" \
  program/macOS/*.dmg \
  program/macOS/*.zip \
  program/Windows/*.exe \
  program/Linux/*.AppImage \
  program/Linux/*.deb \
  program/checksums/SHA256SUMS.txt
```

---

## 📖 추가 문서

- **[QUICKSTART.md](../QUICKSTART.md)** - 빌드 가이드 전체
- **[DISTRIBUTION.md](../DISTRIBUTION.md)** - 상세 배포 가이드
- **[DEBUGGING_NOTES.md](../DEBUGGING_NOTES.md)** - 빌드 이슈 상세 내역

---

**Last Updated**: 2025-01-13
**Build Status**: ⚠️ Blocked by native module compatibility issue
**Next Step**: Resolve better-sqlite3 + Electron 39 compatibility
