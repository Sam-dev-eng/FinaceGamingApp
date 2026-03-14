// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from "framer-motion";

// import { Sidebar } from '../components/game/SideBar';
// import { OpponentCard } from '../components/game/OpponentCard';
// import { EventArea } from '../components/game/EventArea';
// import { Stat } from '../components/game/Stat';
// import { PayLoanModal } from '../components/game/PayloanModel';
// import { HousingModal } from '../components/game/HousingModel';

// export const GameScreen = () => {

//   const [turnIndex, setTurnIndex] = useState(0); 
//   const [currentRound, setCurrentRound] = useState(1);

//   const [isPayModalOpen, setIsPayModalOpen] = useState(false);
//   const [isInitialDecision, setIsInitialDecision] = useState(true);

//   const [hasPaidThisRound, setHasPaidThisRound] = useState(false);
//   const [diceRolled, setDiceRolled] = useState(false);

//   const [turnTimer, setTurnTimer] = useState(60);

//   const [playerData, setPlayerData] = useState({
//     cash: 2400000,
//     loan: 1500000,
//     netWorth: 900000
//   });

//   const isMyTurn = turnIndex === 0;

//   const roundEvents = [
//     {
//       title: "STUDENT LOAN PHASE",
//       desc: "You must make a loan payment first!"
//     },
//     {
//       title: "MEDICAL EMERGENCY",
//       desc: "Unexpected hospital expenses."
//     },
//     {
//       title: "INVESTMENT OPPORTUNITY",
//       desc: "A new investment option appears."
//     },
//     {
//       title: "RETIREMENT PLANNING",
//       desc: "Secure your financial future."
//     }
//   ];

//   // ---------------- TIMER SYSTEM ----------------

//   useEffect(() => {

//     if (!isMyTurn) return;

//     if (turnTimer <= 0) {

//       if (!diceRolled) {
//         autoRollDice();
//       }

//       handleEndTurn();
//       return;
//     }

//     const timer = setInterval(() => {
//       setTurnTimer(prev => prev - 1);
//     }, 1000);

//     return () => clearInterval(timer);

//   }, [turnTimer, isMyTurn]);

//   const resetTurnState = () => {
//     setTurnTimer(60);
//     setHasPaidThisRound(false);
//     setDiceRolled(false);
//   };

//   // ---------------- INITIAL HOUSING ----------------

//   const handleHousingConfirm = (choice) => {
//     console.log("API CALL: Initial Housing ->", choice.id);
//     setIsInitialDecision(false);
//   };

//   // ---------------- LOAN PAYMENT ----------------

//   const handleLoanPayment = (amountPaid) => {

//     const newCash = playerData.cash - amountPaid;
//     const newLoan = playerData.loan - amountPaid;

//     setPlayerData({
//       cash: newCash,
//       loan: newLoan,
//       netWorth: newCash - newLoan
//     });

//     setHasPaidThisRound(true);

//     console.log("API CALL: Loan Paid ->", amountPaid);
//   };

//   // ---------------- DICE SYSTEM ----------------

//   const rollDice = () => {

//     if (!hasPaidThisRound) return;

//     const dice = Math.floor(Math.random() * 6) + 1;

//     setDiceRolled(true);

//     console.log("DICE ROLL:", dice);

//   };

//   const autoRollDice = () => {

//     const dice = Math.floor(Math.random() * 6) + 1;

//     setDiceRolled(true);

//     console.log("AUTO DICE ROLL:", dice);

//   };

//   // ---------------- TURN MANAGEMENT ----------------

//   const handleEndTurn = () => {

//     resetTurnState();

//     if (turnIndex < 2) {

//       setTurnIndex(turnIndex + 1);

//     } else {

//       setTurnIndex(0);

//       if (currentRound < 4) {
//         setCurrentRound(prev => prev + 1);
//       }

//     }
//   };

//   const event = roundEvents[currentRound - 1];

//   return (
//     <div className="h-screen bg-game-bg text-white flex overflow-hidden font-sans">

//       <HousingModal
//         isOpen={isInitialDecision}
//         onConfirm={handleHousingConfirm}
//       />

//       <Sidebar round={currentRound} />

//       <div className="flex-grow flex flex-col p-8 gap-6 max-w-7xl mx-auto w-full">

//         {/* HEADER */}

//         <div className="flex justify-between items-start">

//           <OpponentCard
//             name="Opponent A"
//             balance="1.9M"
//             status={turnIndex === 1 ? "TAKING TURN" : "WAITING"}
//             isTakingTurn={turnIndex === 1}
//           />

//           <div className="text-center pt-2">

//             <h1 className="text-[10px] font-black text-gray-700 tracking-[0.6em] uppercase">
//               Round {currentRound} / 4
//             </h1>

//             <p className="text-accent-blue text-xs font-bold mt-1">
//               {isMyTurn ? `TIME LEFT: ${turnTimer}s` : ""}
//             </p>

//           </div>

//           <OpponentCard
//             name="Opponent B"
//             balance="2.1M"
//             status={turnIndex === 2 ? "TAKING TURN" : "WAITING"}
//             isTakingTurn={turnIndex === 2}
//           />

//         </div>

//         {/* EVENT AREA WITH SWIPE */}

//         <div className="relative overflow-hidden">

//           <AnimatePresence mode="wait">

//             <motion.div
//               key={currentRound}
//               initial={{ x: 400, opacity: 0 }}
//               animate={{ x: 0, opacity: 1 }}
//               exit={{ x: -400, opacity: 0 }}
//               transition={{ duration: 0.4 }}
//             >

//               <EventArea
//                 eventTitle={event.title}
//                 eventDesc={
//                   !hasPaidThisRound
//                     ? "You must make a loan payment first!"
//                     : diceRolled
//                       ? "Dice rolled. Continue the game."
//                       : "Roll the dice to continue."
//                 }
//                 isActive={isMyTurn && hasPaidThisRound}
//                 onRollDice={rollDice}
//               />

//             </motion.div>

//           </AnimatePresence>

//         </div>

//         {/* FOOTER */}

//         <div className={`bg-card-bg p-8 rounded-[2.5rem] border border-gray-800 flex items-center justify-between shadow-2xl transition-all ${!isMyTurn ? 'opacity-50 grayscale-[0.5]' : 'opacity-100'}`}>

//           <div className="flex items-center gap-6">

//             <div className={`w-16 h-16 rounded-full bg-gray-700 border-2 flex items-center justify-center text-3xl shadow-lg transition-colors ${isMyTurn ? 'border-accent-blue shadow-accent-blue/20' : 'border-gray-600'}`}>
//               👤
//             </div>

//             <div>

//               <h2 className="text-accent-blue font-black italic text-xl tracking-tighter">
//                 YOU
//               </h2>

//               <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">
//                 (PLAYER 1)
//               </p>

//             </div>

//           </div>

//           <div className="flex gap-10">

//             <Stat
//               label="Net Worth"
//               value={playerData.netWorth.toLocaleString()}
//               barColor="bg-accent-green"
//               barWidth="w-[70%]"
//             />

//             <Stat
//               label="Available Cash"
//               value={playerData.cash.toLocaleString()}
//             />

//             <Stat
//               label="Loan Balance"
//               value={playerData.loan.toLocaleString()}
//               textColor="text-accent-red"
//             />

//           </div>

//           <div className="flex flex-col gap-2 w-48">

//             <div className="flex gap-2">

//               <button
//                 disabled={!isMyTurn || hasPaidThisRound || turnTimer === 0}
//                 onClick={() => setIsPayModalOpen(true)}
//                 className="flex-1 bg-accent-blue text-[9px] font-black py-3 rounded-xl hover:brightness-110 transition shadow-lg shadow-accent-blue/10 disabled:opacity-30 disabled:cursor-not-allowed"
//               >
//                 {hasPaidThisRound ? "PAID" : "PAY LOAN"}
//               </button>

//               <button
//                 disabled={!isMyTurn}
//                 className="flex-1 bg-gray-800 text-[9px] font-black py-3 rounded-xl hover:bg-gray-700 transition disabled:opacity-30"
//               >
//                 VIEW APART
//               </button>

//             </div>

//             <button
//               onClick={handleEndTurn}
//               disabled={!isMyTurn}
//               className="w-full bg-accent-red text-[9px] font-black py-3 rounded-xl hover:brightness-110 transition shadow-lg shadow-accent-red/10 disabled:bg-gray-800 disabled:shadow-none"
//             >
//               END TURN
//             </button>

//           </div>

//         </div>

//         <PayLoanModal
//           isOpen={isPayModalOpen}
//           onClose={() => setIsPayModalOpen(false)}
//           currentLoan={playerData.loan}
//           onConfirm={handleLoanPayment}
//         />

//       </div>

//     </div>
//   );
// };


 import { Sidebar } from "../components/game/SideBar";
 import { OpponentCard } from "../components/game/OpponentCard"
// import { Stat } from "../components/game/Stat";

import { useGameEngine } from "../components/game/hooks/useGameEngine";
import { useTurnTimer } from "../components/game/hooks/useTurnTimer";

import { PHASES } from "../components/game/utils/phase";
import { rollDice } from "../components/game/utils/dice"

// import { HousingPhase } from "../components/game/phases/HousingPhase";
// import { SurvivalPhase } from "../components/game/phases/SurvivalPhase";
// import { LoanPhase } from "../components/game/phases/LoanPhase";
// import { DicePhase } from "../components/game/phases/DicePhase";
// import { NetWorthPhase } from "../components/game/phases/NetWorthPhase";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EventArea } from "../components/game/EventArea";
import { Stat } from "../components/game/Stat";
import { PayLoanModal } from "../components/game/PayloanModel";
import { HousingModal } from "../components/game/HousingModel";


export const GameScreen = () => {

  const {
    round,
    phase,
    turnIndex,
    players,
    nextTurn,
    updatePlayer
  } = useGameEngine();

  const { time } = useTurnTimer(nextTurn);
  console.log("this is the time")
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isHousingOpen, setIsHousingOpen] = useState(true);
  const currentPlayer = players[turnIndex];
  const isMyTurn = turnIndex === 0;
  const playerData = players[0];

  const handleHousingConfirm = (choice) => {

    console.log("API CALL: Housing choice", choice);

    setIsHousingOpen(false);

    
  };

  const handleLoanPayment = (amountPaid) => {
    const newCash = currentPlayer.cash - amountPaid;
    const newLoan = currentPlayer.loan - amountPaid;
    updatePlayer(turnIndex, {
      cash: newCash,
      loan: newLoan
    });
    console.log("API CALL: Loan Paid ->", amountPaid);
    nextTurn();
  };

  const handlePaySurvival = () => {
    const newCash = currentPlayer.cash - 700000;
    updatePlayer(turnIndex, { cash: newCash });
    console.log("API CALL: Survival Cost Paid");
    nextTurn();
  };

  const handleDiceRoll = () => {
    const dice = rollDice();
    console.log("DICE:", dice);
    nextTurn();
  };

  const getEventTitle = () => {

    switch (phase) {

      case PHASES.HOUSING:
        return "HOUSING DECISION";

      case PHASES.SURVIVAL:
        return "SURVIVAL COST";

      case PHASES.LOAN:
        return "STUDENT LOAN PAYMENT";

      case PHASES.DICE:
        return "UNCERTAINTY EVENT";

      case PHASES.NETWORTH:
        return "NET WORTH UPDATE";

      default:
        return "";

    }
  };

  const getEventDesc = () => {

    switch (phase) {

      case PHASES.HOUSING:
        return "Choose where to live.";

      case PHASES.SURVIVAL:
        return "Pay 700k for survival expenses.";

      case PHASES.LOAN:
        return "Choose an amount to pay your loan.";

      case PHASES.DICE:
        return "Roll the dice to reveal an event.";

      case PHASES.NETWORTH:
        return "Calculating net worth.";

      default:
        return "";

    }
  };

  return (
    <div className="h-screen bg-game-bg text-white flex overflow-hidden font-sans">

      <HousingModal
        isOpen={isHousingOpen && phase === PHASES.HOUSING}
        onConfirm={handleHousingConfirm}
      />

      <Sidebar round={round} />

      <div className="flex-grow flex flex-col p-8 gap-6 max-w-7xl mx-auto w-full">

        {/* HEADER */}

        <div className="flex justify-between items-start">

          <OpponentCard
            name="Opponent A"
            balance="1.9M"
            status={turnIndex === 1 ? "TAKING TURN" : "WAITING"}
            isTakingTurn={turnIndex === 1}
          />

          <div className="text-center pt-2">

            <h1 className="text-[10px] font-black text-gray-700 tracking-[0.6em] uppercase">
              Round {round} / 4
            </h1>

            <p className="text-accent-blue text-xs font-bold mt-1">
              {isMyTurn ? `TIME LEFT: ${time}s` : ""}
            </p>

          </div>

          <OpponentCard
            name="Opponent B"
            balance="2.1M"
            status={turnIndex === 2 ? "TAKING TURN" : "WAITING"}
            isTakingTurn={turnIndex === 2}
          />

        </div>

        {/* EVENT AREA */}

        <div className="relative overflow-hidden">

          <AnimatePresence mode="wait">

            <motion.div
              key={phase}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >

              <EventArea
                eventTitle={getEventTitle()}
                eventDesc={getEventDesc()}
                isActive={isMyTurn}
                onRollDice={handleDiceRoll}
              />

            </motion.div>

          </AnimatePresence>

        </div>

        {/* FOOTER */}

        <div className={`bg-card-bg p-8 rounded-[2.5rem] border border-gray-800 flex items-center justify-between shadow-2xl transition-all ${!isMyTurn ? 'opacity-50 grayscale-[0.5]' : 'opacity-100'}`}>

          <div className="flex items-center gap-6">

            <div className={`w-16 h-16 rounded-full bg-gray-700 border-2 flex items-center justify-center text-3xl shadow-lg transition-colors ${isMyTurn ? 'border-accent-blue shadow-accent-blue/20' : 'border-gray-600'}`}>
              👤
            </div>

            <div>

              <h2 className="text-accent-blue font-black italic text-xl tracking-tighter">
                YOU
              </h2>

              <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">
                (PLAYER 1)
              </p>

            </div>

          </div>

          <div className="flex gap-10">

            <Stat
              label="Net Worth"
              value={(playerData.cash - playerData.loan).toLocaleString()}
              barColor="bg-accent-green"
              barWidth="w-[70%]"
            />

            <Stat
              label="Available Cash"
              value={playerData.cash.toLocaleString()}
            />

            <Stat
              label="Loan Balance"
              value={playerData.loan.toLocaleString()}
              textColor="text-accent-red"
            />

          </div>

          <div className="flex flex-col gap-2 w-48">

            <div className="flex gap-2">

              <button
                disabled={!isMyTurn || phase !== PHASES.LOAN}
                onClick={() => setIsPayModalOpen(true)}
                className="flex-1 bg-accent-blue text-[9px] font-black py-3 rounded-xl hover:brightness-110 transition shadow-lg shadow-accent-blue/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                PAY LOAN
              </button>

              <button
                disabled={!isMyTurn}
                className="flex-1 bg-gray-800 text-[9px] font-black py-3 rounded-xl hover:bg-gray-700 transition disabled:opacity-30"
              >
                VIEW APART
              </button>

            </div>

            <button
              onClick={phase === PHASES.SURVIVAL ? handlePaySurvival : nextTurn}
              disabled={!isMyTurn}
              className="w-full bg-accent-red text-[9px] font-black py-3 rounded-xl hover:brightness-110 transition shadow-lg shadow-accent-red/10 disabled:bg-gray-800 disabled:shadow-none"
            >
              END TURN
            </button>

          </div>

        </div>

        <PayLoanModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          currentLoan={playerData.loan}
          onConfirm={handleLoanPayment}
        />

      </div>

    </div>
  );
};