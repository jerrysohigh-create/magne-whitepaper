// Exact source DOM and locally archived assets; see docs/research output plan.
export function Hero() {
  return (
    <div className={"relative w-full"}>
      <div
        className={
          "absolute -z-10 h-[1062px] w-full bg-[url('/top-bg.jpg')] bg-cover bg-center"
        }
      ></div>
      <section className={"text-center max-w-4xl mx-auto px-6 py-10"}>
        <h1
          className={
            "md:mt-[130px] text-5xl font-bold leading-tight text-white"
          }
        >
          {
            "Explore MAGNE.AI’s hardware and Web3 ecosystem."
          }
        </h1>
        <div className={"mt-10 flex justify-center gap-4"}>
          <a
            className={"flex items-center"}
            href={"/developers/net-config"}
          >
            <button
              className={
                " px-6 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 hover:scale-105 transition-transform cursor-pointer"
              }
            >
              {"VIEW DOCUMENTATION"}
            </button>
          </a>
          <a className={"flex items-center"} href={"#card"}>
            <button
              className={
                "px-6 py-3 rounded-full border border-white text-white hover:bg-white hover:text-black"
              }
            >
              {"RESOURCES"}
            </button>
          </a>
        </div>
      </section>
      <p
        className={
          "text-center text-sm uppercase text-[#008CFF] tracking-wide mt-20"
        }
      >
        {"Explore product information, network documentation, and developer resources."}
      </p>
      <div className={"w-full max-w-[1440px] px-4 mx-auto relative"}>
        <div
          className={
            "swiper swiper-initialized swiper-horizontal relative w-full max-w-5xl mx-auto mt-6 md:mt-12 rounded-xl overflow-hidden swiper-backface-hidden"
          }
        >
          <div className={"swiper-wrapper captured-0"}></div>
        </div>
        <div
          className={
            "my-prev hidden sm:block absolute left-6 md:left-36 top-1/2 -translate-y-1/2 text-white cursor-pointer z-10 hover:opacity-100 opacity-50 transition-opacity duration-300 swiper-button-lock"
          }
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            width={"48"}
            height={"49"}
            viewBox={"0 0 48 49"}
            fill={"none"}
          >
            <g opacity={"0.25"}>
              <path
                d={"M30 36.5L18 24.5L30 12.5"}
                stroke={"white"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
              ></path>
            </g>
          </svg>
        </div>
        <div
          className={
            "my-next hidden sm:block absolute right-6 md:right-36 top-1/2 -translate-y-1/2 text-white cursor-pointer z-10 hover:opacity-100 opacity-50 transition-opacity duration-300 swiper-button-lock"
          }
        >
          <svg
            xmlns={"http://www.w3.org/2000/svg"}
            width={"48"}
            height={"49"}
            viewBox={"0 0 48 49"}
            fill={"none"}
          >
            <g opacity={"0.25"}>
              <path
                d={"M18 36.5L30 24.5L18 12.5"}
                stroke={"white"}
                strokeWidth={"2"}
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
              ></path>
            </g>
          </svg>
        </div>
        <div
          className={
            "my-pagination text-center swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal swiper-pagination-lock"
          }
        ></div>
      </div>
    </div>
  );
}

