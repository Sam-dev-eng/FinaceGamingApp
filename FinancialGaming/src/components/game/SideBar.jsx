export const Sidebar = ({ round }) => (
  <div className="w-16 border-r border-gray-800 flex flex-col items-center py-8 gap-8 bg-black/40">
    <div className="text-accent-blue text-2xl hover:scale-110 transition cursor-pointer">💠</div>
    <div className="flex flex-col gap-6 text-gray-500 text-xl mt-12">
      <button className="hover:text-white transition cursor-pointer p-2">🏠</button>
      <button className="text-white bg-gray-800 p-2 rounded-lg cursor-pointer">🎮</button>
      <button className="hover:text-white transition cursor-pointer p-2">👤</button>
      <button className="hover:text-white transition cursor-pointer p-2">⚙️</button>
    </div>
    <div className="mt-auto pb-6">
      <div className="text-[9px] text-gray-600 font-black uppercase [writing-mode:vertical-lr] tracking-[0.4em] opacity-50">
        ROUND {round} / 4
      </div>
    </div>
  </div>
);
