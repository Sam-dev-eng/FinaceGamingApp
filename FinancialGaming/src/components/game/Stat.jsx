export const Stat = ({ label, value, textColor = "text-white", barColor, barWidth }) => (
  <div className="w-40">
    <label className="text-gray-500 text-[9px] uppercase font-black tracking-widest mb-1 block">
      {label}
    </label>
    <p className={`text-xl font-mono ${textColor}`}>₦{value}</p>
    {barColor && (
      <div className="h-1.5 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full ${barWidth} shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-500`} />
      </div>
    )}
  </div>
);
