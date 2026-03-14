import { useEffect } from 'react';

/**
 * Reset all modal states when page loads OR when ID changes.
 */
export default function useModalReset(setters = {}) {
  useEffect(() => {
    Object.values(setters).forEach((setState) => {
      if (typeof setState === 'function') {
        setState(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
