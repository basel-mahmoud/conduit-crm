export function ConduitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7h6a4 4 0 0 1 4 4v2a4 4 0 0 0 4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="5" cy="7" r="2.2" fill="currentColor" />
      <circle cx="19" cy="17" r="2.2" fill="currentColor" />
    </svg>
  );
}
