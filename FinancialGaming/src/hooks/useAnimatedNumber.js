import { useEffect, useRef, useState } from "react";

export const useAnimatedNumber = (value, duration = 800) => {
  const [display, setDisplay] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(null);
  const prevRef = useRef(value);
  const isFirstRender = useRef(true);
  const frameRef = useRef(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevRef.current = value;
      setDisplay(value);
      return;
    }

    if (prevRef.current === value) return;

    const from = prevRef.current;
    const to = value;
    const diff = to - from;

    setDirection(diff > 0 ? "up" : diff < 0 ? "down" : null);
    setIsAnimating(true);

    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + diff * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        prevRef.current = to;
        setTimeout(() => {
          setIsAnimating(false);
          setDirection(null);
        }, 350);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return { display, isAnimating, direction };
};
