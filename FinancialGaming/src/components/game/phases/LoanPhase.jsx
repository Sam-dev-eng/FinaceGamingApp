export const LoanPhase = ({ onPay }) => {

  return (

    <div className="flex gap-3">

      <button onClick={() => onPay(50000)}>50k</button>
      <button onClick={() => onPay(100000)}>100k</button>
      <button onClick={() => onPay(200000)}>200k</button>

    </div>

  );
};