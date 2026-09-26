import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

const COACHMARK_MS = 3000;
const SPOTLIGHT_PAD = 7;

export function HowToPlayCoachmark({
  targetRef,
  onDone,
}: {
  targetRef: RefObject<HTMLElement | null>;
  onDone: () => void;
}) {
  const [spotlight, setSpotlight] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const syncSpotlight = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    setSpotlight({
      top: rect.top - SPOTLIGHT_PAD,
      left: rect.left - SPOTLIGHT_PAD,
      width: rect.width + SPOTLIGHT_PAD * 2,
      height: rect.height + SPOTLIGHT_PAD * 2,
    });
  }, [targetRef]);

  useLayoutEffect(() => {
    syncSpotlight();

    window.addEventListener('resize', syncSpotlight);
    window.addEventListener('scroll', syncSpotlight, true);

    const target = targetRef.current;
    const resizeObserver = target ? new ResizeObserver(syncSpotlight) : null;
    if (target && resizeObserver) resizeObserver.observe(target);

    return () => {
      window.removeEventListener('resize', syncSpotlight);
      window.removeEventListener('scroll', syncSpotlight, true);
      resizeObserver?.disconnect();
    };
  }, [syncSpotlight, targetRef]);

  useEffect(() => {
    const timeout = window.setTimeout(onDone, COACHMARK_MS);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  if (!spotlight) return null;

  const calloutTop = spotlight.top + spotlight.height + 10;
  const calloutLeft = spotlight.left + spotlight.width / 2;

  return createPortal(
    <div className="help-coachmark-layer" aria-hidden="true">
      <div
        className="help-coachmark-spotlight"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
      />
      <div
        className="help-coachmark-callout"
        style={{
          top: calloutTop,
          left: calloutLeft,
        }}
      >
        <span className="help-coachmark-arrow" aria-hidden="true" />
        <span className="help-coachmark-label">How to Play</span>
      </div>
    </div>,
    document.body,
  );
}
