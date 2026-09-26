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
    if (rect.width === 0 && rect.height === 0) return;
    setSpotlight({
      top: rect.top - SPOTLIGHT_PAD,
      left: rect.left - SPOTLIGHT_PAD,
      width: rect.width + SPOTLIGHT_PAD * 2,
      height: rect.height + SPOTLIGHT_PAD * 2,
    });
  }, [targetRef]);

  useLayoutEffect(() => {
    let attempts = 0;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const attachObserver = () => {
      const target = targetRef.current;
      if (!target || resizeObserver) return;
      resizeObserver = new ResizeObserver(syncSpotlight);
      resizeObserver.observe(target);
    };

    const trySync = () => {
      syncSpotlight();
      attachObserver();
      attempts += 1;
      if (!targetRef.current && attempts < 12) {
        rafId = window.requestAnimationFrame(trySync);
      }
    };

    trySync();

    window.addEventListener('resize', syncSpotlight);
    window.addEventListener('scroll', syncSpotlight, true);

    return () => {
      window.cancelAnimationFrame(rafId);
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
