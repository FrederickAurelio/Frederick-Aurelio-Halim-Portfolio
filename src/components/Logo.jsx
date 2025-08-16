import { HiMiniChartBar } from "react-icons/hi2";

function Logo({ logo }) {
  return (
    <div className="flex w-full flex-col justify-between pb-5 pt-2 text-3xl font-semibold md:text-4xl lg:col-span-1 lg:py-0 lg:text-[30px]">
      {logo === "memories" && (
        <img className="w-24 md:w-32" src="./memories.webp" alt="memories" />
      )}
      {logo === "wildoasis" && (
        <img className="w-36" src="./wildoasis.png" alt="wildoasis" />
      )}
      {logo === "bookling" && <h1>📕Bookling</h1>}
      {logo === "fxtrade" && (
        <p className={`flex text-emerald-700`}>
          <HiMiniChartBar size={42} />
          FXTrade
        </p>
      )}
      {logo === "promis" && (
        <img className="w-40" src="./promis.png" alt="promis" />
      )}
    </div>
  );
}

export default Logo;
