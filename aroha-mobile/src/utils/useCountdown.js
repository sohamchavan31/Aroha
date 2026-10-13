import { useEffect, useState } from 'react';

// Seconds left until a resend is allowed. start(n) begins a new countdown.
export function useCountdown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return [left, setLeft];
}
