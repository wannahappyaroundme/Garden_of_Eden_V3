# Adam & Eve Persona Implementation

## Overview

Implemented dual persona system (Adam/Eve) with Korean name handling for Garden of Eden V3. This allows users to choose between two AI personas during onboarding, with culturally-aware name parsing for Korean users.

## Key Changes

### 1. Korean Name Parser (`src/shared/utils/name-parser.ts`)
**Created**: Utility for parsing Korean names and removing surnames

**Features**:
- Parses 80+ common Korean surnames (김, 이, 박, 최, etc.)
- Removes surname for friendly addressing (e.g., "이경석" → "경석")
- Preserves English names as-is
- Helper functions: `parseDisplayName()`, `isKoreanName()`, `getKoreanSurname()`

**Example**:
```typescript
parseDisplayName("이경석") // Returns: "경석"
parseDisplayName("John Smith") // Returns: "John Smith"
```

### 2. Database Schema Updates

**File**: `src/main/database/schema.ts`

**Added fields to `user_profile` table**:
- `display_name TEXT NOT NULL` - Name without surname (for Korean names)
- `selected_persona TEXT NOT NULL CHECK(selected_persona IN ('Adam', 'Eve'))` - Chosen persona

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,              -- NEW
  selected_persona TEXT NOT NULL CHECK(...), -- NEW
  age_group TEXT,
  occupation TEXT CHECK(...),
  interests TEXT,
  tone_preference TEXT NOT NULL CHECK(...),
  proactive_frequency TEXT NOT NULL CHECK(...),
  onboarding_completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

### 3. Type System Updates

#### `src/shared/types/user-profile.types.ts`
- Added `PersonaName = 'Adam' | 'Eve'`
- Added `displayName: string` to `UserProfile`
- Added `selectedPersona: PersonaName` to `UserProfile` and `CreateUserProfileInput`

#### `src/shared/types/onboarding.types.ts`
- Added `PersonaChoice = 'Adam' | 'Eve'`
- Added `personaChoice: PersonaChoice` to `OnboardingAnswers`
- Added persona selection as first onboarding question

**Persona Selection Question**:
```typescript
{
  id: 'personaChoice',
  type: 'choice',
  question: 'Who do you want to meet?',
  aiMessage: '안녕! 난 에덴이야 😊\n\n나는 두 명의 친구가 있어.\n누구를 만나고 싶어?',
  choices: [
    {
      value: 'Adam',
      label: 'Adam (아담)',
      emoji: '👨',
      description: '활발하고 적극적인 성격',
    },
    {
      value: 'Eve',
      label: 'Eve (이브)',
      emoji: '👩',
      description: '차분하고 사려깊은 성격',
    },
  ],
  required: true,
  order: 1,
}
```

### 4. Repository Updates

**File**: `src/main/database/repositories/user-profile.repository.ts`

**Changes**:
- Imported `parseDisplayName` utility
- Updated `create()` method to:
  - Parse display name from full name
  - Store `selectedPersona` from input
  - Log persona selection
- Updated `mapToUserProfile()` to include new fields

**Example**:
```typescript
create(input: CreateUserProfileInput): UserProfile {
  const displayName = parseDisplayName(input.name); // "이경석" → "경석"

  stmt.run(
    input.name,
    displayName,
    input.selectedPersona, // 'Adam' or 'Eve'
    // ... other fields
  );
}
```

### 5. Onboarding Service Updates

**File**: `src/main/services/learning/onboarding.service.ts`

**Changes**:
- Imported `parseDisplayName` utility
- Updated `completeOnboarding()` to save `selectedPersona`
- Updated `generateWelcomeMessage()` to:
  - Use display name (without surname for Korean names)
  - Introduce AI persona by name ("나는 아담이야" or "저는 이브예요")
  - Adjust greeting based on tone preference

**Welcome Message Examples**:

**Casual tone**:
```
경석야, 이제 널 조금 알 것 같아! 앞으로 잘 부탁해 😊

나는 아담이야. 같이 재밌게 지내보자!

궁금한 거 있으면 언제든 물어봐!

지금 뭐 하고 있었어?
```

**Friendly-formal tone**:
```
경석님, 이제 조금 알 것 같아요! 앞으로 잘 부탁드려요 😊

저는 이브예요. 함께 좋은 시간 보내요!

궁금한 점이 있으면 언제든 말씀해주세요.

지금 무엇을 하고 계셨나요?
```

**Professional tone**:
```
경석님, 감사합니다. 앞으로 최선을 다해 도와드리겠습니다.

저는 아담입니다. 잘 부탁드립니다.

궁금한 점이 있으면 언제든 말씀해주세요.

지금 무엇을 하고 계셨나요?
```

### 6. UI Updates

**File**: `src/renderer/pages/Onboarding.tsx`

**Changes**:
- Updated `completeOnboarding()` to generate persona-aware welcome message
- Temporarily generates message in frontend (will be replaced with IPC call)
- Parses display name and persona choice from answers
- Creates contextual greeting based on tone and persona

## Naming Convention

**Critical naming rules** (per user requirements):

1. **"Eden"** = Project name (executable file name)
2. **AI personas** = "Adam" (아담) or "Eve" (이브)
3. **AI introduction**:
   - "안녕 나는 아담이야" (Adam)
   - "안녕 나는 이브야" (Eve)
4. **Korean names**: Remove surname, use given name only
   - "이경석" → Address as "경석"
   - Friendlier, more casual addressing
5. **English names**: Use full name as-is
   - "John Smith" → Address as "John Smith"

## User Flow

1. App launches → Onboarding starts
2. **Step 1**: AI (as "Eden") asks: "누구를 만나고 싶어?" (Who do you want to meet?)
3. User chooses: Adam (활발하고 적극적) or Eve (차분하고 사려깊은)
4. **Step 2**: AI asks for name: "뭐라고 불러주면 돼?"
5. User enters name (Korean or English)
6. **Steps 3-5**: Tone preference, proactive frequency, occupation, interests
7. **Completion**: AI introduces itself with chosen persona name
   - Uses display name (surname removed if Korean)
   - Adjusts tone based on preference
   - Mentions persona name: "나는 아담이야" / "저는 이브예요"

## Technical Implementation

### Data Flow
```
User Input (name="이경석", personaChoice="Adam")
    ↓
parseDisplayName("이경석") → "경석"
    ↓
Database: {
  name: "이경석",
  display_name: "경석",
  selected_persona: "Adam"
}
    ↓
Welcome Message:
"경석야, 이제 널 조금 알 것 같아!
나는 아담이야. 같이 재밌게 지내보자!"
```

### Type Safety
All persona-related values are type-checked:
- `PersonaName = 'Adam' | 'Eve'` (type system)
- `selected_persona CHECK IN ('Adam', 'Eve')` (database constraint)

### Database Migration
**Note**: Existing databases will need migration to add new columns:
- Add `display_name` column
- Add `selected_persona` column with CHECK constraint
- Populate `display_name` from existing `name` values

## Files Modified

1. **Created**:
   - `src/shared/utils/name-parser.ts` - Korean name parsing utility

2. **Modified**:
   - `src/main/database/schema.ts` - Added display_name, selected_persona
   - `src/shared/types/user-profile.types.ts` - Added PersonaName type, new fields
   - `src/shared/types/onboarding.types.ts` - Added PersonaChoice, persona question
   - `src/main/database/repositories/user-profile.repository.ts` - Parse display name, save persona
   - `src/main/services/learning/onboarding.service.ts` - Persona-aware welcome messages
   - `src/renderer/pages/Onboarding.tsx` - Persona-aware completion flow

## Next Steps

### Immediate (In Progress)
- [ ] Connect IPC handlers for onboarding
- [ ] Implement ConversationInitiator service
- [ ] Add resizable window (default 180px)
- [ ] Implement persona sidebar (hidden by default)
- [ ] Add fullscreen toggle

### Future Enhancements
- [ ] Different base personalities for Adam vs Eve
- [ ] Persona-specific conversation starters
- [ ] Ability to switch between personas
- [ ] Multiple personas (beyond Adam/Eve)
- [ ] Persona creation UI in sidebar

## Testing Recommendations

1. **Korean Name Parsing**:
   - Test common surnames (김, 이, 박, etc.)
   - Test single-character names
   - Test edge cases (surname-only, empty strings)

2. **English Names**:
   - Test full names (first + last)
   - Test single names
   - Test special characters

3. **Onboarding Flow**:
   - Test persona selection → name entry flow
   - Test different tone preferences with both personas
   - Test welcome message generation for all combinations

4. **Database**:
   - Verify display_name is correctly stored
   - Verify selected_persona is correctly stored
   - Test retrieval and mapping

## Related Documents

- `PROJECT_EDEN_V3_MASTER_SPEC.md` - Complete specification
- `OVERFITTING_PREVENTION.md` - Persona learning system
- `CLAUDE.md` - Project instructions for AI assistant

---

**Last Updated**: 2025-11-14
**Status**: ✅ Implementation Complete (Adam/Eve + Korean Name Parsing)
**Next Phase**: Window Management & Persona Sidebar
