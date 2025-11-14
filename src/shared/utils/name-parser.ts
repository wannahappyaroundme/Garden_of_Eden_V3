/**
 * Name Parser Utility
 * Handles Korean and English name formatting
 */

/**
 * Korean surnames (most common ones)
 * Source: Korean National Statistical Office
 */
const KOREAN_SURNAMES = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '오', '한', '신', '서', '권', '황', '안', '송', '류', '홍',
  '전', '고', '문', '손', '양', '배', '백', '허', '유', '남',
  '심', '노', '하', '곽', '성', '차', '주', '우', '구', '라',
  '진', '민', '지', '엄', '채', '원', '천', '방', '공', '현',
  '변', '염', '도', '석', '선', '설', '마', '길', '연', '위',
  '표', '명', '기', '반', '왕', '금', '옥', '육', '인', '맹',
  '제', '탁', '국', '여', '진', '어', '은', '편', '용', '경',
];

/**
 * Parse full name to display name
 * - For Korean names: Remove surname (e.g., "이경석" → "경석")
 * - For English names: Use full name as-is
 *
 * @param fullName - Full name (Korean or English)
 * @returns Display name for friendly address
 */
export function parseDisplayName(fullName: string): string {
  if (!fullName || fullName.trim().length === 0) {
    return fullName;
  }

  const trimmedName = fullName.trim();

  // Check if name starts with Korean surname
  for (const surname of KOREAN_SURNAMES) {
    if (trimmedName.startsWith(surname)) {
      const nameWithoutSurname = trimmedName.substring(surname.length);

      // Ensure there's actually a name after the surname
      if (nameWithoutSurname.length > 0) {
        return nameWithoutSurname;
      }
    }
  }

  // If not Korean (or no surname detected), return as-is
  return trimmedName;
}

/**
 * Check if a name is likely Korean
 * (Starts with common Korean surname)
 */
export function isKoreanName(fullName: string): boolean {
  if (!fullName || fullName.trim().length === 0) {
    return false;
  }

  const trimmedName = fullName.trim();

  return KOREAN_SURNAMES.some(surname => trimmedName.startsWith(surname));
}

/**
 * Get surname from a Korean name
 * Returns null if not a Korean name
 */
export function getKoreanSurname(fullName: string): string | null {
  if (!fullName || fullName.trim().length === 0) {
    return null;
  }

  const trimmedName = fullName.trim();

  for (const surname of KOREAN_SURNAMES) {
    if (trimmedName.startsWith(surname)) {
      return surname;
    }
  }

  return null;
}
