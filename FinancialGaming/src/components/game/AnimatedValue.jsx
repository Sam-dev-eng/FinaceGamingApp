import { motion } from "framer-motion";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

export const AnimatedValue = ({
  value,
  className = "text-xl font-mono text-white",
  prefix = "₦",
  format = (n) => n.toLocaleString("en-NG"),
  idleColor = "",
}) => {
  const { display, isAnimating, direction } = useAnimatedNumber(value);

  const pulseColor =
    isAnimating && direction === "up"
      ? "text-accent-green"
      : isAnimating && direction === "down"
        ? "text-accent-red"
        : idleColor;

  const glowClass =
    isAnimating && direction === "up"
      ? "drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]"
      : isAnimating && direction === "down"
        ? "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]"
        : "";

  return (
    <motion.span
      className={`inline-block origin-center tabular-nums ${className} ${pulseColor} ${glowClass}`}
      animate={{ scale: isAnimating ? 1.45 : 1 }}
      transition={{
        scale: {
          duration: isAnimating ? 0.2 : 0.35,
          ease: "easeOut",
        },
      }}
    >
      {prefix}
      {format(display)}
    </motion.span>
  );
};
