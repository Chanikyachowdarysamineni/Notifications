import { useState, useEffect } from 'react';

export type DeviceTier = 'phone' | 'tablet' | 'desktop' | 'board';

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>('desktop'); // Default for SSR / initial

  useEffect(() => {
    const checkTier = () => {
      const width = window.innerWidth;
      
      // If we are explicitly on the board route, we can treat it as board,
      // but device tier is purely viewport based.
      if (width >= 1920) {
        setTier('board');
      } else if (width >= 1024) {
        setTier('desktop');
      } else if (width >= 768) {
        setTier('tablet');
      } else {
        setTier('phone');
      }
    };

    checkTier();
    window.addEventListener('resize', checkTier);
    window.addEventListener('orientationchange', checkTier);

    return () => {
      window.removeEventListener('resize', checkTier);
      window.removeEventListener('orientationchange', checkTier);
    };
  }, []);

  return tier;
}
