/**
 * Error Types (v3.5.2)
 * Actionable error messages with user guidance
 *
 * This module provides:
 * - ErrorCode enum matching Rust backend error codes
 * - ActionableError for user-friendly error display
 * - Utility functions for error conversion and parsing
 */

// ============================================================================
// ERROR CODES (matching Rust backend)
// ============================================================================

/** Error codes matching Rust ErrorCode enum */
export enum ErrorCode {
  // Connection errors (1xxx)
  OLLAMA_NOT_RUNNING = 1001,
  OLLAMA_CONNECTION_FAILED = 1002,
  NETWORK_TIMEOUT = 1003,
  NETWORK_UNAVAILABLE = 1004,

  // Model errors (2xxx)
  MODEL_NOT_FOUND = 2001,
  MODEL_DOWNLOAD_FAILED = 2002,
  MODEL_INCOMPATIBLE = 2003,
  MODEL_LOAD_FAILED = 2004,
  INSUFFICIENT_VRAM = 2005,

  // Database errors (3xxx)
  DATABASE_CONNECTION_FAILED = 3001,
  DATABASE_QUERY_FAILED = 3002,
  DATABASE_CORRUPTED = 3003,
  DATABASE_LOCKED = 3004,
  MIGRATION_FAILED = 3005,

  // File system errors (4xxx)
  FILE_NOT_FOUND = 4001,
  FILE_READ_FAILED = 4002,
  FILE_WRITE_FAILED = 4003,
  PERMISSION_DENIED = 4004,
  DISK_FULL = 4005,

  // AI/Inference errors (5xxx)
  INFERENCE_FAILED = 5001,
  CONTEXT_TOO_LONG = 5002,
  TOKEN_LIMIT_EXCEEDED = 5003,
  EMBEDDING_FAILED = 5004,
  RAG_RETRIEVAL_FAILED = 5005,

  // User input errors (6xxx)
  INVALID_INPUT = 6001,
  MISSING_REQUIRED_FIELD = 6002,
  VALIDATION_FAILED = 6003,

  // Authentication errors (7xxx)
  OAUTH_FAILED = 7001,
  TOKEN_EXPIRED = 7002,
  UNAUTHORIZED = 7003,

  // System errors (9xxx)
  INTERNAL_ERROR = 9001,
  UNKNOWN = 9999,
}

// ============================================================================
// STRUCTURED ERROR FROM BACKEND
// ============================================================================

/** Structured application error from Rust backend */
export interface AppError {
  /** Error code for programmatic handling */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Recovery suggestion for the user */
  recovery: string;
  /** Optional technical details for debugging */
  details?: string;
  /** Error timestamp (Unix milliseconds) */
  timestamp: number;
}

/** Check if an error is an AppError from backend */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'recovery' in error &&
    'timestamp' in error
  );
}

/** Parse error from backend response */
export function parseBackendError(error: unknown): AppError | null {
  if (isAppError(error)) {
    return error;
  }

  // Try to parse as JSON string
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      if (isAppError(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, continue to return null
    }
  }

  return null;
}

// ============================================================================
// ACTIONABLE ERROR (UI-friendly format)
// ============================================================================

export type ErrorCategory =
  | 'network'
  | 'file'
  | 'permission'
  | 'validation'
  | 'ai-model'
  | 'database'
  | 'unknown';

export interface ActionableError {
  category: ErrorCategory;
  title: string;
  description: string;
  whatHappened: string;
  whyItHappened: string;
  howToFix: string[];
  technicalDetails?: string;
  canRetry?: boolean;
  canDismiss?: boolean;
}

/**
 * Convert generic errors to actionable errors with user guidance
 */
export function createActionableError(
  error: unknown,
  context?: string
): ActionableError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('ECONNREFUSED')
  ) {
    return {
      category: 'network',
      title: '네트워크 연결 오류',
      description: '서버에 연결할 수 없습니다',
      whatHappened: '요청한 작업을 수행하는 동안 네트워크 연결에 실패했습니다.',
      whyItHappened:
        '인터넷 연결이 끊겼거나, 서버가 응답하지 않거나, 방화벽이 연결을 차단했을 수 있습니다.',
      howToFix: [
        '인터넷 연결 상태를 확인하세요',
        'Wi-Fi 또는 이더넷 연결을 다시 연결해보세요',
        '방화벽 설정에서 앱을 허용했는지 확인하세요',
        '잠시 후 다시 시도하세요',
      ],
      technicalDetails: errorMessage,
      canRetry: true,
      canDismiss: true,
    };
  }

  // File system errors
  if (
    errorMessage.includes('ENOENT') ||
    errorMessage.includes('EACCES') ||
    errorMessage.includes('file')
  ) {
    return {
      category: 'file',
      title: '파일 접근 오류',
      description: '파일을 읽거나 쓸 수 없습니다',
      whatHappened: '파일 시스템 작업을 수행하는 동안 오류가 발생했습니다.',
      whyItHappened: '파일이 존재하지 않거나, 권한이 없거나, 파일이 다른 프로그램에서 사용 중일 수 있습니다.',
      howToFix: [
        '파일 경로가 올바른지 확인하세요',
        '파일 및 폴더에 대한 읽기/쓰기 권한이 있는지 확인하세요',
        '파일을 사용 중인 다른 프로그램을 닫아보세요',
        '앱을 관리자 권한으로 실행해보세요',
      ],
      technicalDetails: errorMessage,
      canRetry: true,
      canDismiss: true,
    };
  }

  // Permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('EACCES')) {
    return {
      category: 'permission',
      title: '권한 오류',
      description: '작업을 수행할 권한이 없습니다',
      whatHappened: '필요한 권한이 없어 작업을 완료할 수 없습니다.',
      whyItHappened: '시스템 설정에서 앱에 필요한 권한이 거부되었을 수 있습니다.',
      howToFix: [
        '시스템 설정에서 앱 권한을 확인하세요',
        '앱을 관리자 권한으로 실행해보세요',
        '파일 또는 폴더의 소유권과 권한을 확인하세요',
      ],
      technicalDetails: errorMessage,
      canRetry: false,
      canDismiss: true,
    };
  }

  // AI model errors
  if (
    errorMessage.includes('model') ||
    errorMessage.includes('llama') ||
    errorMessage.includes('inference')
  ) {
    return {
      category: 'ai-model',
      title: 'AI 모델 오류',
      description: 'AI 모델을 로드하거나 실행할 수 없습니다',
      whatHappened: 'AI 모델을 사용하는 동안 오류가 발생했습니다.',
      whyItHappened:
        'AI 모델 파일이 손상되었거나, 메모리가 부족하거나, 모델이 아직 다운로드되지 않았을 수 있습니다.',
      howToFix: [
        '설정에서 AI 모델을 다시 다운로드하세요',
        '다른 프로그램을 종료하여 메모리를 확보하세요',
        '컴퓨터를 재시작하고 다시 시도하세요',
        '최소 22GB 이상의 RAM이 필요합니다',
      ],
      technicalDetails: errorMessage,
      canRetry: true,
      canDismiss: true,
    };
  }

  // Database errors
  if (errorMessage.includes('database') || errorMessage.includes('sqlite')) {
    return {
      category: 'database',
      title: '데이터베이스 오류',
      description: '데이터를 저장하거나 불러올 수 없습니다',
      whatHappened: '데이터베이스 작업 중 오류가 발생했습니다.',
      whyItHappened: '데이터베이스 파일이 손상되었거나, 디스크 공간이 부족하거나, 파일이 잠겨 있을 수 있습니다.',
      howToFix: [
        '디스크 공간을 확보하세요 (최소 5GB 필요)',
        '앱을 재시작하세요',
        '데이터베이스 백업이 있다면 복원을 시도하세요',
        '문제가 지속되면 데이터베이스를 초기화하세요 (데이터 손실 주의)',
      ],
      technicalDetails: errorMessage,
      canRetry: true,
      canDismiss: true,
    };
  }

  // Validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return {
      category: 'validation',
      title: '입력 오류',
      description: '입력값이 올바르지 않습니다',
      whatHappened: '입력한 값이 요구사항을 충족하지 않습니다.',
      whyItHappened: '필수 항목이 비어있거나, 형식이 잘못되었거나, 범위를 벗어났을 수 있습니다.',
      howToFix: [
        '모든 필수 항목을 입력했는지 확인하세요',
        '입력 형식이 올바른지 확인하세요',
        '값이 허용된 범위 내에 있는지 확인하세요',
      ],
      technicalDetails: errorMessage,
      canRetry: false,
      canDismiss: true,
    };
  }

  // Unknown errors - generic fallback
  return {
    category: 'unknown',
    title: '알 수 없는 오류',
    description: '예상치 못한 오류가 발생했습니다',
    whatHappened: context
      ? `${context} 작업 중 예상치 못한 오류가 발생했습니다.`
      : '작업 수행 중 예상치 못한 오류가 발생했습니다.',
    whyItHappened: '정확한 원인을 파악할 수 없습니다.',
    howToFix: [
      '앱을 재시작하세요',
      '컴퓨터를 재시작하세요',
      '문제가 지속되면 GitHub Issues에 보고해주세요',
      '아래 기술 세부 정보를 함께 제공해주세요',
    ],
    technicalDetails: errorMessage,
    canRetry: true,
    canDismiss: true,
  };
}
