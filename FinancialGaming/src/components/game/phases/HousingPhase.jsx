export const HousingPhase = ({ onChoose }) => {

  return (

    <div className="flex gap-4">

      <button onClick={() => onChoose("parents")}>Stay with Parents</button>

      <button onClick={() => onChoose("shared")}>Shared Apartment</button>

      <button onClick={() => onChoose("single")}>Single Apartment</button>

      <button onClick={() => onChoose("luxury")}>Luxury Apartment</button>

    </div>

  );
};