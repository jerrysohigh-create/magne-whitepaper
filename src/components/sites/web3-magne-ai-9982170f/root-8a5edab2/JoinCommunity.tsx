// Exact source DOM and locally archived assets; see docs/research output plan.
export function JoinCommunity() {
  return (
    <div id={"card"}>
      <div
        className={
          "flex justify-center items-center py-10 md:py-12 bg-[#0A1535] w-full max-w-[1216px] px-4 m-auto"
        }
      >
        <div
          className={
            "relative w-full px-4 sm:px-6 md:px-8 py-8 md:py-12 rounded-2xl bg-[#1B2540]/90 shadow-xl text-center "
          }
        >
          <h2
            className={
              "text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 w-full leading-snug"
            }
          >
            {"Explore the documentation"}
            <br />
            {"and connect with the"}
            <br />
            {""}
            <span className={"text-white"}>{"Magne.AI"}</span>
            {" community."}
          </h2>
          <a
            href={"https://github.com/magne-ai"}
            target={"_blank"}
            rel={"noopener noreferrer"}
          >
            <button
              className={
                "mt-3 md:mt-4 mb-2 md:mb-4 px-5 md:px-6 py-2.5 md:py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 hover:scale-105 transition-transform cursor-pointer"
              }
            >
              {"EXPLORE GITHUB"}
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

