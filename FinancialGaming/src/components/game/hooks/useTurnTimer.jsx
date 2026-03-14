import { useEffect, useState } from "react";

export const useTurnTimer = (onTimeout) => {

  const [time, setTime] = useState(10);
  useEffect(() => {
    const timer = setInterval(() => {
      console.log("running this function again")
      setTime((prev) => {
        if (prev < 2) {
          console.log("loadTime out")
          onTimeout();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onTimeout]);
  const resetTimer = () => {
    setTime(10);
  };
  return { time, resetTimer };
};  