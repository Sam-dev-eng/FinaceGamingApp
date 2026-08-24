export const LobbySlot = ({
  name,
  status,
  isHost,
  isEmpty,
  isBot,
  canRemove,
  onRemove,
}) => {
  const isReady = status === "READY";

  if (isEmpty) {
    return (
      <div className="p-8 rounded-[2rem] border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-700 bg-black/20 h-64 transition-all hover:border-gray-600 group">
        <span className="text-5xl group-hover:scale-125 transition">+</span>
      </div>
    );
  }

  const handleClick = () => {
    if (!canRemove || !onRemove) return;
    onRemove();
  };

  return (
    <div
      role={canRemove ? "button" : undefined}
      tabIndex={canRemove ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (!canRemove || !onRemove) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onRemove();
        }
      }}
      className={`p-8 rounded-[2rem] border-2 transition-all h-64 flex flex-col items-center justify-center text-center gap-4 relative ${
        isReady
          ? "border-accent-blue bg-card-bg shadow-lg shadow-accent-blue/5"
          : "border-gray-800 bg-black/40"
      } ${canRemove ? "cursor-pointer hover:border-accent-red/60 hover:bg-accent-red/5 group" : ""}`}
    >
      {canRemove && (
        <span className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-accent-red/15 text-accent-red border border-accent-red/30 opacity-0 group-hover:opacity-100 transition">
          Remove
        </span>
      )}

      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl border-4 ${
          isReady ? "border-accent-blue bg-gray-800" : "border-gray-700 bg-gray-900"
        }`}
      >
        {isReady ? "👤" : "⌛"}
      </div>

      <div>
        <h3
          className={`text-xl font-black italic tracking-tighter ${isReady ? "text-white" : "text-gray-500"}`}
        >
          {name}
        </h3>
        <p
          className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${
            isReady ? "text-accent-blue" : "text-gray-600"
          }`}
        >
          {isReady ? "READY" : isBot ? "PRACTICE BOT" : "WAITING"}
        </p>
      </div>

      {isHost && (
        <span className="bg-white text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
          Host
        </span>
      )}

      {canRemove && (
        <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 group-hover:text-accent-red transition">
          Tap to remove player
        </p>
      )}
    </div>
  );
};
