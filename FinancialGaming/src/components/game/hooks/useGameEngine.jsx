import { useState } from "react";
import { PHASES } from "../utils/phase";

export const useGameEngine = () => {

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState(PHASES.HOUSING);
  const [turnIndex, setTurnIndex] = useState(0);

  const [players, setPlayers] = useState([
    { name: "YOU", cash: 2400000, loan: 1500000 ,rentType : "PARENTS"},
    { name: "Opponent A", cash: 2400000, loan: 1500000 ,rentType : "SHARED_APARTMENT"},
    { name: "Opponent B", cash: 2400000, loan: 1500000 ,rentType : "LUXURY_APARTMENT"}
  ]);
  
  const nextTurn = () => {
    
    if (turnIndex < 2) {
      console.log("In next turn of if---")
      setTurnIndex(turnIndex + 1);
    } else {
      console.log("In next turn of else---")
      setTurnIndex(0);
      
      nextPhase();
    }
  };

  const nextPhase = () => {
    if (phase < PHASES.NETWORTH) {
      setPhase((p) => p + 1);
    } else {
      setPhase(PHASES.HOUSING);
      console.log("Round is --------",round)
      setRound((r) => r + 1);
    }
  };

  const updatePlayer = (index, updates) => {
    const updated = [...players];
    updated[index] = { ...updated[index], ...updates };
    setPlayers(updated);
  };
  return {
    round,
    phase,
    turnIndex,
    players,
    nextTurn,
    nextPhase,
    updatePlayer
  };
};
 