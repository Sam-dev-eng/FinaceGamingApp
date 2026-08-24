import { AnimatedValue } from "./AnimatedValue";

export const Stat = ({
  label,
  value,
  textColor = "text-white",
  barColor,
  barWidth,
  prefix = "₦",
  format,
  compact = false,
  prominent = false,
}) => (
  <div className={compact ? "min-w-0" : "w-40"}>
    <label
      className={`text-gray-500 uppercase font-black tracking-widest block ${
        prominent ? "text-[8px] mb-0.5" : compact ? "text-[8px] mb-0.5" : "text-[9px] mb-1"
      }`}
    >
      {label}
    </label>
    <AnimatedValue
      value={value}
      className={`font-mono ${textColor} ${
        prominent
          ? "text-sm sm:text-base font-bold leading-tight"
          : compact
            ? "text-xs sm:text-sm"
            : "text-xl"
      }`}
      idleColor={textColor}
      prefix={prefix}
      format={format}
    />
    {barColor && !compact && (
      <div className="h-1.5 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full ${barWidth} shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-500`}
        />
      </div>
    )}
  </div>
);
