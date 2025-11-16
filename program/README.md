# 📦 Garden of Eden V3 - 배포 파일

이 폴더는 **빌드된 실행 파일**을 저장하는 곳입니다.

---

## ✅ 현재 상태: Tauri 빌드 완료!

### 빌드 완료 항목
- ✅ **macOS (Apple Silicon)**: DMG 빌드 완료
  - `Garden of Eden V3_1.0.0_aarch64.dmg` (7.1MB - Tauri)
  - qwen2.5:7b 통합 (phi3:mini에서 업그레이드)

### Windows 빌드 제한사항
⚠️ **Windows 빌드는 Windows 머신에서만 가능**합니다.

Windows 10/11 머신에서 다음 명령 실행:
```bash
npm install
npm run build:renderer
cd src-tauri
cargo build --release
cargo tauri build
```

생성된 파일 위치: `src-tauri/target/release/bundle/msi/`

---

## 📁 빌드 파일 구조

```
program/
├── macOS/
│   └── Garden of Eden V3_1.0.0_aarch64.dmg (Tauri - 7.1MB)
│
└── checksums/
    └── SHA256SUMS.txt
```

**참고**: Windows와 Linux 빌드는 제거되었습니다. macOS만 현재 지원됩니다.

---

## 🏗️ 빌드 명령어

### macOS에서 빌드
```bash
# 프론트엔드 빌드
npm run build:renderer

# Tauri macOS 빌드
cd src-tauri
cargo tauri build

# 결과물 복사
cp target/release/bundle/dmg/*.dmg ../program/macOS/
```

### Windows에서 빌드
```bash
# 프론트엔드 빌드
npm run build:renderer

# Tauri Windows 빌드
cd src-tauri
cargo tauri build

# 결과물 복사
cp target/release/bundle/msi/*.msi ../program/Windows/
```

---

## 📊 파일 크기 비교

| 플랫폼 | Tauri | Electron (레거시) |
|-------|-------|------------------|
| **macOS DMG** | 7.1MB ⚡ | 285MB |
| **macOS ZIP** | - | 276MB |
| **Windows MSI** | ~15MB (예상) | ~150MB (예상) |

**⚠️ 참고**:
- AI 모델 (~16.5GB)은 포함되지 않으며, 사용자가 첫 실행 시 다운로드합니다.
- Tauri 빌드가 Electron 대비 40배 작습니다! 🎉

---

## 🚀 사용자 설치 방법

### macOS
1. `Garden of Eden V3_1.0.0_aarch64.dmg` 다운로드
2. DMG 파일 열기
3. 앱을 Applications 폴더로 드래그

### Windows
1. `Garden of Eden V3_1.0.0_x64-setup.msi` 다운로드
2. 설치 프로그램 실행
3. 지시에 따라 설치

---

## 📖 추가 문서

- **[CLAUDE.md](../CLAUDE.md)** - 프로젝트 개요
- **[PROJECT_EDEN_V3_MASTER_SPEC.md](../PROJECT_EDEN_V3_MASTER_SPEC.md)** - 전체 사양

---

**Last Updated**: 2025-11-16
**Build Status**: ✅ Tauri macOS build complete | ⏳ Windows build requires Windows machine
**Framework**: Tauri 2.9 (migrated from Electron)
**Bundle Size**: 7.1MB (macOS DMG)
