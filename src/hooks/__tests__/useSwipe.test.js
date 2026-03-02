import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipe } from '../useSwipe';

function touch(el, startX, startY, endX, endY) {
  el.dispatchEvent(
    new TouchEvent('touchstart', {
      touches: [{ clientX: startX, clientY: startY }],
    })
  );
  el.dispatchEvent(
    new TouchEvent('touchend', {
      changedTouches: [{ clientX: endX, clientY: endY }],
    })
  );
}

describe('useSwipe', () => {
  it('calls onSwipeLeft for a leftward swipe exceeding threshold', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    renderHook(() => useSwipe(ref, { onSwipeLeft, onSwipeRight }));

    touch(el, 200, 100, 100, 100); // dx = -100, well over 50px threshold
    expect(onSwipeLeft).toHaveBeenCalledOnce();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('calls onSwipeRight for a rightward swipe exceeding threshold', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    renderHook(() => useSwipe(ref, { onSwipeLeft, onSwipeRight }));

    touch(el, 100, 100, 200, 100); // dx = +100
    expect(onSwipeRight).toHaveBeenCalledOnce();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('ignores swipes below the 50px threshold', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    renderHook(() => useSwipe(ref, { onSwipeLeft, onSwipeRight }));

    touch(el, 100, 100, 130, 100); // dx = 30, below threshold
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('ignores primarily vertical gestures', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    renderHook(() => useSwipe(ref, { onSwipeLeft, onSwipeRight }));

    touch(el, 100, 100, 160, 300); // dx=60, dy=200 — vertical dominates
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('does nothing when ref has no current element', () => {
    const ref = { current: null };
    const onSwipeLeft = vi.fn();

    // Should not throw
    renderHook(() => useSwipe(ref, { onSwipeLeft }));
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });
});
