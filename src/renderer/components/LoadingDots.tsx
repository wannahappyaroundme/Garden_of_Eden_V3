/**
 * Loading Dots Component
 * Animated three-dot loading indicator
 */

export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1" aria-label="로딩 중">
      <span
        className="w-2 h-2 rounded-full bg-current animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-current animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-current animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
