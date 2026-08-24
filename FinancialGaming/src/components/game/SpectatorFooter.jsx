import { AnimatedValue } from "./AnimatedValue";

export const SpectatorFooter = ({ players, turnIndex, roomCode }) => (
  <footer className="shrink-0 rounded-2xl border border-accent-blue/30 bg-accent-blue/5 px-3 py-2.5">
    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-accent-blue text-center mb-2">
      👁 Spectating room {roomCode ?? "—"} · view only
    </p>
    <div className="grid grid-cols-3 gap-2">
      {players.map((player, index) => {
        const isActive = index === turnIndex;
        return (
          <div
            key={player.id}
            className={`rounded-xl border px-2 py-2 text-center transition-all ${
              isActive
                ? "border-naira-gold bg-black/40 shadow-md shadow-naira-gold/10"
                : "border-gray-800 bg-black/20"
            }`}
          >
            <p
              className={`text-[9px] font-black uppercase truncate ${
                isActive ? "text-naira-gold" : "text-gray-400"
              }`}
            >
              {player.name}
            </p>
            <AnimatedValue
              value={player.cash - player.loan}
              className="text-naira-gold font-mono text-sm block mt-0.5"
              idleColor="text-naira-gold"
            />
            <p className="text-[7px] text-gray-600 uppercase tracking-wider mt-0.5">Net worth</p>
            {isActive && (
              <p className="text-[7px] text-naira-gold font-black uppercase mt-1 animate-pulse">
                Playing
              </p>
            )}
          </div>
        );
      })}
    </div>
  </footer>
);
