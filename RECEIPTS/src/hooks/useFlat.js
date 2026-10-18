import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Demo-safety guard: ?flat=1 disables ALL 3D, parallax, grid, and beam
 * animation. Also folds in prefers-reduced-motion so we never animate
 * against the user's OS setting.
 */
export function useFlat() {
  const [flatParam, setFlatParam] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('flat') === '1';
  });

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const onPop = () => {
      setFlatParam(new URLSearchParams(window.location.search).get('flat') === '1');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const isFlat = flatParam || reducedMotion;

  // Reflect onto <html class="flat"> so CSS can disable grid + animations.
  useEffect(() => {
    document.documentElement.classList.toggle('flat', isFlat);
  }, [isFlat]);

  return isFlat;
}

export { useReducedMotion };
export default useFlat;
