# 📦 Garden of Eden V3 - Distribution Files

이 폴더는 **빌드된 배포 파일**을 저장하는 곳입니다.

---

## ✅ 현재 상태: macOS 빌드 성공!

**해결 방법**: Electron을 28.0.0으로 다운그레이드하여 `better-sqlite3` 네이티브 모듈 호환성 문제 해결

### 빌드 완료 항목
- ✅ **macOS (Apple Silicon)**: DMG + ZIP 빌드 완료
  - `Garden of Eden V3-1.0.0-arm64.dmg` (285MB)
  - `Garden of Eden V3-1.0.0-arm64-mac.zip` (276MB)
  - `latest-mac.yml` (자동 업데이트 메타데이터)

### Windows 빌드 제한사항
⚠️ **Windows 빌드는 Windows 머신에서만 가능**합니다.

macOS에서는 네이티브 모듈 크로스 컴파일이 불가능합니다. Windows 빌드를 생성하려면:

1. Windows 10/11 머신에서 다음 명령 실행:
```bash
npm install
npm run build:electron
npx electron-builder --win
```

2. 생성된 파일을 `program/Windows/` 폴더로 복사

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
**Build Status**: ✅ macOS build complete | ⏳ Windows build requires Windows machine
**Electron Version**: 28.0.0 (downgraded from 39.1.2 for native module compatibility)
**Next Step**: Build Windows version on Windows machine
