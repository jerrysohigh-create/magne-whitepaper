// Exact source DOM and locally archived assets; see docs/research output plan.
export function Adoption() {
  return (
    <div className={"relative w-full overflow-hidden  bg-transparent"}>
      <div
        className={
          "absolute inset-0 -z-10 w-full h-full bg-[url('/massAdoption.png')] bg-cover bg-center"
        }
      ></div>
      <section
        className={
          "relative w-full max-w-[1440px] mx-auto min-h-[520px] md:h-[800px] text-white px-4 py-10 md:py-0"
        }
      >
        <div
          className={"flex flex-col justify-center ml-2 md:ml-24 mt-6 md:mt-20"}
        >
          <h2 className={"text-2xl sm:text-3xl md:text-4xl font-bold w-72"}>
            {"Network documentation."}
          </h2>
          <p className={"mt-2 text-xs sm:text-sm"}>
            <span className={"text-[#43B4CA] font-bold text-lg sm:text-xl"}>
              {"· "}
            </span>
            {"Developer resources"}
          </p>
        </div>
        <div
          className={
            "mt-6 md:mt-0 md:absolute md:right-28 md:bottom-20 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 px-2"
          }
        >
          <div className={"space-y-4 md:space-y-8"}>
            <div
              className={
                "relative rounded-2xl p-5 md:p-6 bg-black/60 border border-white/10 shadow-lg backdrop-blur flex flex-col"
              }
            >
              <div className={"flex items-center"}>
                <span
                  className={
                    "inline-block w-[1px] h-5 rounded-full bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500"
                  }
                ></span>
                <h3 className={"ml-2 text-lg md:text-xl font-semibold"}>
                  {"Network configuration"}
                </h3>
              </div>
              <p className={"mt-3 text-[#D0D0DC] text-base md:text-lg"}>
                {
                  "Review network identifiers and connection settings in the developer documentation. Check the network environment before connecting."
                }
              </p>
              <div
                className={
                  "mt-6 text-[10px] md:text-[11px] uppercase tracking-wider text-gray-400"
                }
              >
                {"NETWORK SETTINGS"}
              </div>
            </div>
            <div
              className={
                "relative rounded-2xl p-5 md:p-6 bg-black/60 border border-white/10 shadow-lg backdrop-blur flex flex-col"
              }
            >
              <div className={"flex items-center"}>
                <span
                  className={
                    "inline-block w-[1px] h-5 rounded-full bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500"
                  }
                ></span>
                <h3 className={"ml-2 text-lg md:text-xl font-semibold"}>
                  {"Transactions and fees"}
                </h3>
              </div>
              <p className={"mt-3 text-[#D0D0DC] text-base md:text-lg"}>
                {
                  "Consult the documentation for transaction setup. Fees and confirmation times depend on the network environment and current conditions."
                }
              </p>
              <div
                className={
                  "mt-6 text-[10px] md:text-[11px] uppercase tracking-wider text-gray-400"
                }
              >
                {"TRANSACTION INFORMATION"}
              </div>
            </div>
          </div>
          <div className={"space-y-4 md:space-y-8 md:-mt-16 lg:-mt-24"}>
            <div
              className={
                "relative rounded-2xl p-5 md:p-6 bg-black/60 border border-white/10 shadow-lg backdrop-blur flex flex-col"
              }
            >
              <div className={"flex items-center"}>
                <span
                  className={
                    "inline-block w-[1px] h-5 rounded-full bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500"
                  }
                ></span>
                <h3 className={"ml-2 text-lg md:text-xl font-semibold"}>
                  {"Validation and security"}
                </h3>
              </div>
              <p className={"mt-3 text-[#D0D0DC] text-base md:text-lg"}>
                {
                  "Review the documented network architecture and security model. No network or application can eliminate every security risk."
                }
              </p>
              <div
                className={
                  "mt-6 text-[10px] md:text-[11px] uppercase tracking-wider text-gray-400"
                }
              >
                {"NETWORK ARCHITECTURE"}
              </div>
            </div>
            <div
              className={
                "relative rounded-2xl p-5 md:p-6 bg-black/60 border border-white/10 shadow-lg backdrop-blur flex flex-col"
              }
            >
              <div className={"flex items-center"}>
                <span
                  className={
                    "inline-block w-[1px] h-5 rounded-full bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500"
                  }
                ></span>
                <h3 className={"ml-2 text-lg md:text-xl font-semibold"}>
                  {"Developer tools"}
                </h3>
              </div>
              <p className={"mt-3 text-[#D0D0DC] text-base md:text-lg"}>
                {
                  "Explore the available developer documentation and check the requirements of each tool before use."
                }
              </p>
              <div
                className={
                  "mt-6 text-[10px] md:text-[11px] uppercase tracking-wider text-gray-400"
                }
              >
                {"DOCUMENTATION"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

