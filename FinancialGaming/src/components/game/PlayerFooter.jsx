import { Stat } from "./Stat";
import { BankBorrowPanel } from "./BankBorrowPanel";

export const PlayerFooter = ({
  myPlayer,
  isMyTurn,
  bankAvailable,
  survivalShortfall,
  onBorrow,
}) => (
  <footer
    className={`shrink-0 rounded-xl sm:rounded-2xl border border-gray-800 bg-card-bg/90 backdrop-blur-sm px-2.5 py-2 sm:px-3 md:px-4 ${
      isMyTurn ? "border-gray-700" : "border-gray-800"
    }`}
  >
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
      <div className="flex items-center gap-2 shrink-0 sm:w-28 lg:w-32 min-w-0">
        <div
          className={`w-8 h-8 shrink-0 rounded-full bg-gray-700 border-2 flex items-center justify-center text-base ${
            isMyTurn ? "border-accent-blue" : "border-gray-600"
          }`}
        >
          👤
        </div>
        <div className="min-w-0">
          <p className="text-accent-blue font-black italic text-sm leading-tight truncate">
            {myPlayer.name}
          </p>
          <p className="text-gray-600 text-[8px] font-black uppercase tracking-widest">You</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1 min-w-0">
        <Stat
          compact
          prominent
          label="Net"
          value={myPlayer.cash - myPlayer.loan}
          textColor="text-accent-green"
        />
        <Stat compact prominent label="Cash" value={myPlayer.cash} />
        <Stat compact prominent label="Loan" value={myPlayer.loan} textColor="text-accent-red" />
        <Stat
          compact
          prominent
          label="Credit"
          value={myPlayer.creditScore ?? 500}
          textColor={
            (myPlayer.creditScore ?? 500) > 200 ? "text-accent-green" : "text-accent-red"
          }
          prefix=""
          format={(n) => String(Math.round(n))}
        />
      </div>

      {bankAvailable && (
        <div className="w-full sm:w-36 lg:w-40 shrink-0">
          <BankBorrowPanel
            creditScore={myPlayer.creditScore ?? 500}
            currentCash={myPlayer.cash}
            currentLoan={myPlayer.loan}
            suggestedAmount={survivalShortfall}
            onBorrow={onBorrow}
            compact
            collapsible
          />
        </div>
      )}
    </div>
  </footer>
);
