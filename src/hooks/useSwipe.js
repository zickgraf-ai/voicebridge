import { useRef, useEffect } from 'react';

const SWIPE_THRESHOLD = 50;

/**
 * Detects horizontal swipe gestures on a ref element.
 * Ignores vertical scrolling (only fires when horizontal distance > vertical).
 * @param {React.RefObject} ref - element to listen on
 * @param {{ onSwipeLeft?: () => void, onSwipeRight?: () => void }} handlers
 */
export function useSwipe(ref, { onSwipeLeft, onSwipeRight }) {
  const start = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleTouchStart(e) {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    }

    function handleTouchEnd(e) {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;

      // Only trigger if horizontal movement exceeds vertical
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight]);
}
