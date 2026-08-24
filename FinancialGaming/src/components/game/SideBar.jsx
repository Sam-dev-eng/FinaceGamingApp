export const Sidebar = ({ round, totalRounds = 4 }) => (
  <aside className="hidden md:flex w-14 lg:w-16 shrink-0 border-r border-gray-800 flex-col items-center py-6 lg:py-8 gap-6 lg:gap-8 bg-black/40">
    <div className="text-accent-blue text-xl lg:text-2xl hover:scale-110 transition cursor-pointer">💠</div>
    <div className="flex flex-col gap-4 lg:gap-6 text-gray-500 text-lg lg:text-xl mt-8 lg:mt-12">
      <button type="button" className="hover:text-white transition cursor-pointer p-2" aria-label="Home">🏠</button>
      <button type="button" className="text-white bg-gray-800 p-2 rounded-lg cursor-pointer" aria-label="Game">🎮</button>
      <button type="button" className="hover:text-white transition cursor-pointer p-2" aria-label="Profile">👤</button>
      <button type="button" className="hover:text-white transition cursor-pointer p-2" aria-label="Settings">⚙️</button>
    </div>
    <div className="mt-auto pb-4 lg:pb-6">
      <div className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase [writing-mode:vertical-lr] tracking-[0.35em] lg:tracking-[0.4em] opacity-50">
        ROUND {round} / {totalRounds}
      </div>
    </div>
  </aside>
);
