import { useEffect, useRef } from "react";

/**
 * usePolling - Runs `fn` every `delay` milliseconds while the component is mounted.
 * Automatically clears the interval on unmount.
 *
 * @param {Function} fn    - The function to call on every tick (should be stable / useCallback-wrapped).
 * @param {number}   delay - Polling interval in ms (default: 30 000 = 30 s).
 */
export default function usePolling(fn, delay = 30000) {
  // Keep a ref so we always call the *latest* version of fn without restarting the interval
  const savedFn = useRef(fn);
  useEffect(() => {
    savedFn.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!delay || delay <= 0) return;
    const id = setInterval(() => savedFn.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
