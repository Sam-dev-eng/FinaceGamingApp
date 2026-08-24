import { motion, AnimatePresence } from "framer-motion";

export const LobbyActivityFeed = ({ activity, connected }) => {
  return (
    <div className="w-full max-w-4xl mb-8">
      <div className="flex items-center justify-between mb-3 px-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
          Live Lobby Feed
        </p>
        <span
          className={`text-[9px] font-black uppercase tracking-widest ${
            connected ? "text-accent-green" : "text-gray-600"
          }`}
        >
          {connected ? "WebSocket live" : "Connecting…"}
        </span>
      </div>
      <div className="bg-black/30 border border-gray-800 rounded-2xl p-4 min-h-[88px] max-h-[140px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {activity.length === 0 ? (
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center py-4">
              Waiting for players to join…
            </p>
          ) : (
            activity.map((item) => (
              <motion.p
                key={item.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-300 py-1 border-b border-gray-800/50 last:border-0"
              >
                <span className="text-accent-blue font-bold">•</span> {item.text}
              </motion.p>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
