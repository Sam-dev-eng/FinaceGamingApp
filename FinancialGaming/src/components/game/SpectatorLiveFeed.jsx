export const SpectatorLiveFeed = ({
  lastEventMessage,
  simultaneousUpdates = [],
  isSimultaneous,
}) => (
  <div className="flex-1 min-h-[120px] flex flex-col rounded-xl sm:rounded-2xl border border-gray-800/60 bg-black/25 overflow-hidden">
    <div className="shrink-0 px-3 sm:px-4 py-2 border-b border-gray-800/80">
      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-accent-blue">
        Live feed
      </p>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2 sm:space-y-3">
      {lastEventMessage && (
        <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">
            Latest
          </p>
          <p className="text-sm text-white leading-relaxed">{lastEventMessage}</p>
        </div>
      )}

      {isSimultaneous && simultaneousUpdates.length > 0 && (
        <div className="space-y-2">
          <p className="text-[8px] font-black uppercase tracking-widest text-accent-blue text-center">
            Net worth update — all players
          </p>
          {simultaneousUpdates.map((player) => (
            <div
              key={player.id}
              className="rounded-xl border border-gray-800 bg-black/40 px-3 py-2"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-black uppercase text-white">{player.name}</span>
                <span className="text-[10px] font-mono text-naira-gold">
                  Net ₦{player.netWorth?.toLocaleString?.() ?? player.netWorth}
                </span>
              </div>
              {player.events?.map((event) => (
                <div
                  key={`${player.id}-${event.label}`}
                  className="flex justify-between text-[10px] gap-2"
                >
                  <span className="text-gray-400">{event.label}</span>
                  {event.amount > 0 && (
                    <span
                      className={
                        event.type === "gain" ? "text-accent-green" : "text-accent-red"
                      }
                    >
                      {event.type === "gain" ? "+" : "−"}₦{event.amount.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!lastEventMessage && !isSimultaneous && (
        <p className="text-center text-gray-600 text-xs uppercase tracking-widest py-8">
          Waiting for the next move…
        </p>
      )}
    </div>
  </div>
);
