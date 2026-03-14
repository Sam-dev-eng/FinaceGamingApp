export const NetWorthPhase = ({ players }) => {

  return (

    <div>

      {players.map((p) => {

        const netWorth = p.cash - p.loan;

        return (

          <p key={p.name}>
            {p.name} Net Worth: {netWorth.toLocaleString()}
          </p>

        );

      })}

    </div>

  );

};