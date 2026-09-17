import { useEffect, useRef } from "react";

/**
 * Returns a debounced version of the provided callback function.
 * The debounced function will delay invoking the callback until after `wait` milliseconds
 * have elapsed since the last time it was invoked.
 *
 * @param callback - The function to debounce.
 * @param wait - The number of milliseconds to delay.
 * @returns A debounced version of the callback.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  wait: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update the ref with the latest callback so the debounced function uses the most recent version
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, wait);
  };
}