import type { Ref } from 'react';

export function HeaderHelpButton({
  buttonRef,
  onClick,
}: {
  buttonRef?: Ref<HTMLButtonElement>;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="header-help-btn"
      aria-label="How to Play"
      onClick={onClick}
    >
      ?
    </button>
  );
}
