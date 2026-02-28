import { useRef, useCallback } from 'react';

/**
 * Detects horizontal swipe gestures on a touch device.
 * Returns touch event handlers to attach to a container element.
 *
 * @param {Function} onSwipeLeft  - Called when user swipes left (finger moves left)
 * @param {Function} onSwipeRight - Called when user swipes right (finger moves right)
 * @param {number}   threshold    - Minimum horizontal distance in px (default 50)
 */
export function useSwipe(onSwipeLeft, onSwipeRight, threshold = 50) {
  const touchStart = useRef(null);

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      touchStart.current = null;

      // Only fire if horizontal movement exceeds threshold
      // and horizontal distance is greater than vertical (not a scroll)
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
