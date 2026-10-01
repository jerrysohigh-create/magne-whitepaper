"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MenuLink = { text: string; href: string; target?: string };
type MenuGroup = { title?: string; direct?: MenuLink; links: MenuLink[] };
const menuSections: { label: string; groups: MenuGroup[] }[] = [
  {
    "label": "LEARNING",
    "groups": [
      {
        "title": "Introduction",
        "links": [
          {
            "text": "What is MAGNE.AI?",
            "href": "/learning/what-is-magne"
          },
          {
            "text": "Magne dApp",
            "href": "/learning/magne-dapp"
          }
        ]
      },
      {
        "title": "Basic Information",
        "links": [
          {
            "text": "What Is Proof-of-Work?",
            "href": "/learning/pow"
          },
          {
            "text": "$MHA",
            "href": "/learning/mha"
          }
        ]
      },
      {
        "title": "Tokenomics",
        "links": [
          {
            "text": "MAGNE.AI Tokenomics",
            "href": "/learning/tokenomics"
          },
          {
            "text": "Governance Overview",
            "href": "/learning/gov-overview"
          },
          {
            "text": "Governance",
            "href": "/learning/governance"
          },
          {
            "text": "Incentives",
            "href": "/learning/incentives"
          },
          {
            "text": "Metrics",
            "href": "/learning/metrics"
          }
        ]
      },
      {
        "direct": {
          "text": "Team & Execution",
          "href": "/learning/team-execution"
        },
        "links": []
      },
      {
        "direct": {
          "text": "Milestone",
          "href": "/learning/milestone"
        },
        "links": []
      }
    ]
  },
  {
    "label": "DEVELOPERS",
    "groups": [
      {
        "links": [
          {
            "text": "Network Configurations (Testnet)",
            "href": "/developers/net-config"
          },
          {
            "text": "Developer Tools",
            "href": "/developers/tools"
          }
        ]
      },
      {
        "title": "Developer Quickstart",
        "links": [
          {
            "text": "Build A Smart Contract",
            "href": "/developers/build-contract"
          },
          {
            "text": "Build A App",
            "href": "/developers/build-app"
          },
          {
            "text": "Launch an ERC-20 Token with Foundry",
            "href": "/developers/launch-token"
          }
        ]
      }
    ]
  },
  {
    "label": "SOLUTIONS",
    "groups": [
      {
        "links": [
          {
            "text": "How to Connect Magne",
            "href": "/solutions/connect"
          },
          {
            "text": "How To Get $MHA",
            "href": "/solutions/get-mha"
          },
          {
            "text": "Why Magne Needs M Hash (L2)",
            "href": "/solutions/why-l2"
          },
          {
            "text": "Why M Hash is Built on OP Stack",
            "href": "/solutions/opstack"
          },
          {
            "text": "M Hash Optimizations on OP Stack",
            "href": "/solutions/optimizations"
          },
          {
            "text": "Hardware Empowerment",
            "href": "/solutions/hardware"
          },
          {
            "text": "High-Security Applications",
            "href": "/solutions/security"
          },
          {
            "text": "POAi and DePIN Integration",
            "href": "/solutions/poai-depin"
          }
        ]
      }
    ]
  },
  {
    "label": "NETWORKS",
    "groups": [
      {
        "links": [
          {
            "text": "Magne Block Explorer",
            "href": "/networks/explorer"
          },
          {
            "text": "Gas Faucet",
            "href": "/networks/faucet"
          }
        ]
      },
      {
        "title": "Layers",
        "links": [
          {
            "text": "MAGNE.AI Layer 1 - Magne",
            "href": "/networks/l1"
          },
          {
            "text": "MAGNE.AI Layer 2 - M Hash",
            "href": "/networks/l2"
          }
        ]
      }
    ]
  },
  {
    "label": "HELP",
    "groups": [
      {
        "links": [
          {
            "text": "FAQs",
            "href": "/help/faqs"
          },
          {
            "text": "Glossary",
            "href": "/help/glossary"
          },
          {
            "text": "Contact Us",
            "href": "/help/contact"
          }
        ]
      }
    ]
  },
  {
    "label": "COMMUNITY",
    "groups": [
      {
        "links": [
          {
            "text": "Twitter",
            "href": "/community/twitter"
          },
          {
            "text": "Telegram",
            "href": "/community/telegram"
          }
        ]
      }
    ]
  }
];

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setExpanded(null);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);
  return (
    <header
      className={
        "w-full border-b border-black/10 bg-[#1d2b4e] from-white to-gray-100"
      }
    >
      <div
        className={
          "mx-auto max-w-screen-2xl flex items-center h-14 px-4 md:px-10"
        }
      >
        <div className={"flex items-center"}>
          <a
            target={"_blank"}
            className={"flex items-center"}
            href={"https://www.magne.ai/"}
            rel={"noopener noreferrer"}
          >
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              width={"140"}
              height={"16"}
              viewBox={"0 0 140 16"}
              fill={"none"}
            >
              <path
                d={
                  "M4.5885 0.503462C5.94067 0.503462 6.44467 0.760769 7.04317 2.13269L11.746 12.4158C11.8137 12.5438 11.9292 12.6073 12.068 12.6073H12.3445C12.5043 12.6073 12.6198 12.5438 12.6653 12.4158L17.3437 2.13269C17.9188 0.760769 18.3972 0.503462 19.775 0.503462H22.3207C23.9038 0.503462 24.3378 1.06077 24.3378 2.73269V15.0292C24.3378 15.35 24.1547 15.5 23.8105 15.5H21.4013C21.0805 15.5 20.8973 15.35 20.8973 15.0292V3.84615C20.8973 3.69615 20.8518 3.63269 20.7363 3.63269H20.531C20.3478 3.63269 20.2545 3.67423 20.209 3.80346L15.7815 13.4C15.0943 15.0085 14.336 15.5 12.845 15.5H11.5372C10.0473 15.5 9.31467 15.0085 8.60067 13.4L4.12883 3.80346C4.06117 3.67423 3.99 3.63269 3.83017 3.63269H3.62367C3.486 3.63269 3.41833 3.69615 3.41833 3.84615V15.0292C3.41833 15.35 3.25733 15.5 2.91433 15.5H0.504C0.161 15.5 0 15.35 0 15.0292V2.73269C0 1.04 0.414167 0.503462 1.995 0.503462H4.5885ZM36.9775 0.503462C38.1698 0.503462 38.857 0.824231 39.6153 2.13269L47.208 15.0085C47.3678 15.3085 47.3002 15.5 46.9315 15.5H44.0172C43.7185 15.5 43.5797 15.4365 43.4898 15.2415L41.9767 12.6281H30.989L29.498 15.2415C29.3825 15.4342 29.2693 15.5 28.9707 15.5H25.9665C25.6002 15.5 25.5302 15.3085 25.69 15.0085L33.215 2.13269C33.9477 0.824231 34.6605 0.503462 35.6253 0.503462H36.9775ZM40.3515 9.84385L36.7943 3.69615C36.7267 3.58769 36.6333 3.54615 36.5178 3.54615H36.3802C36.2647 3.54615 36.197 3.58769 36.1258 3.69615L32.592 9.84385H40.3515ZM65.5375 0.503462C65.8583 0.503462 66.0415 0.653462 66.0415 0.974231V3.07423C66.0415 3.39615 65.8583 3.54615 65.5375 3.54615H54.0447C51.6833 3.54615 50.9927 4.20846 50.9927 6.48038V9.56462C50.9927 11.8365 51.6798 12.4781 54.0447 12.4781H61.614C62.4178 12.4781 62.7608 12.1573 62.7608 11.1915V9.60731C62.7608 9.39385 62.6687 9.30731 62.4855 9.30731H55.7632C55.4423 9.30731 55.2592 9.15731 55.2592 8.83539V6.95115C55.2592 6.65115 55.4423 6.48038 55.7632 6.48038H65.3287C65.7883 6.48038 66.0158 6.69269 66.0158 7.12192V12.2208C66.0158 14.6208 65.03 15.4965 63.1727 15.4965H53.9292C49.273 15.4965 47.5067 13.955 47.5067 9.84039V6.15615C47.5067 2.04269 49.273 0.5 53.9292 0.5H65.5375V0.503462ZM72.464 0.503462C74.116 0.503462 74.3925 0.824231 75.1252 1.76577L83.5648 12.2208C83.6325 12.3281 83.7258 12.3708 83.8635 12.3708H84.0688C84.1855 12.3708 84.252 12.3073 84.252 12.1573V0.974231C84.252 0.653462 84.413 0.503462 84.7572 0.503462H87.2118C87.556 0.503462 87.7158 0.653462 87.7158 0.974231V13.2708C87.7158 14.9635 87.0963 15.5 85.6497 15.5H83.6103C81.9583 15.5 81.6818 15.1792 80.9725 14.2365L72.5095 3.78269C72.4162 3.67423 72.3485 3.63269 72.2108 3.63269H72.0043C71.8667 3.63269 71.8212 3.69615 71.8212 3.84615V15.0292C71.8212 15.35 71.6392 15.5 71.3172 15.5H68.8625C68.5183 15.5 68.3585 15.35 68.3585 15.0292V2.73269C68.3585 1.04 68.9558 0.503462 70.3978 0.503462H72.464ZM106.554 0.503462C106.875 0.503462 107.058 0.653462 107.058 0.974231V3.05C107.058 3.35 106.875 3.52192 106.554 3.52192H96.4845C94.1232 3.52192 93.5025 4.14269 93.5025 6.39269V6.50115H106.419C106.74 6.50115 106.923 6.65115 106.923 6.97192V8.87808C106.923 9.19885 106.74 9.34885 106.419 9.34885H93.5025V9.60731C93.5025 11.8573 94.1232 12.4781 96.4845 12.4781H106.554C106.875 12.4781 107.058 12.65 107.058 12.95V15.0292C107.058 15.35 106.875 15.5 106.554 15.5H96.4612C91.8062 15.5 90.0387 13.9365 90.0387 9.84385V6.15962C90.0387 2.06577 91.8062 0.503462 96.4612 0.503462H106.554ZM111.806 12.4988C112.15 12.4988 112.312 12.65 112.312 12.9708V15.0292C112.312 15.35 112.15 15.5 111.806 15.5H109.557C109.214 15.5 109.053 15.35 109.053 15.0292V12.9708C109.053 12.65 109.214 12.4988 109.557 12.4988H111.806ZM124.883 0.503462C126.075 0.503462 126.763 0.824231 127.521 2.13269L135.113 15.0085C135.274 15.3085 135.206 15.5 134.836 15.5H131.923C131.623 15.5 131.486 15.4365 131.396 15.2415L129.883 12.6281H118.894L117.404 15.2415C117.287 15.4342 117.175 15.5 116.877 15.5H113.872C113.506 15.5 113.435 15.3085 113.596 15.0085L121.121 2.13269C121.854 0.824231 122.567 0.503462 123.53 0.503462H124.883ZM128.254 9.84385L124.697 3.69615C124.629 3.58769 124.536 3.54615 124.42 3.54615H124.283C124.167 3.54615 124.1 3.58769 124.028 3.69615L120.494 9.84385H128.254ZM139.496 0.503462C139.839 0.503462 140 0.653462 140 0.974231V15.0292C140 15.35 139.839 15.5 139.496 15.5H137.018C136.675 15.5 136.514 15.35 136.514 15.0292V0.974231C136.514 0.653462 136.675 0.503462 137.018 0.503462H139.496Z"
                }
                fill={"white"}
              ></path>
            </svg>
          </a>
        </div>
        <nav className={"hidden md:flex items-stretch gap-6 mx-auto"}>
          <a
            className={
              "flex items-center pb-4 pt-4 text-base font-semibold tracking-wide hover:text-[#0088FF]"
            }
            aria-current={pathname.startsWith("/learning") ? "true" : undefined}
            href={"/learning"}
          >
            <span className={"px-4"}>{"LEARNING"}</span>
          </a>
          <a
            className={
              "flex items-center pb-4 pt-4 text-base font-semibold tracking-wide hover:text-[#0088FF]"
            }
            aria-current={pathname.startsWith("/developers") ? "true" : undefined}
            href={"/developers"}
          >
            <span>{"DEVELOPERS"}</span>
          </a>
          <a
            className={
              "flex items-center pb-4 pt-4 text-base font-semibold tracking-wide hover:text-[#0088FF]"
            }
            aria-current={pathname.startsWith("/solutions") ? "true" : undefined}
            href={"/solutions"}
          >
            <span className={"px-4"}>{"SOLUTIONS"}</span>
          </a>
          <a
            className={
              "flex items-center pb-4 pt-4 text-base font-semibold tracking-wide hover:text-[#0088FF]"
            }
            aria-current={pathname.startsWith("/networks") ? "true" : undefined}
            href={"/networks"}
          >
            <span className={"px-4"}>{"NETWORKS"}</span>
          </a>
          <a
            className={
              "flex items-center pb-4 pt-4 text-base font-semibold tracking-wide hover:text-[#0088FF]"
            }
            aria-current={pathname.startsWith("/help") ? "true" : undefined}
            href={"/help"}
          >
            <span className={"px-4"}>{"HELP"}</span>
          </a>
          <a
            className={
              "flex items-center pb-4 pt-4 text-base font-semibold tracking-wide hover:text-[#0088FF]"
            }
            aria-current={pathname.startsWith("/community") ? "true" : undefined}
            href={"/community"}
          >
            <span className={"px-4"}>{"COMMUNITY"}</span>
          </a>
        </nav>
        <div className={"flex items-center md:hidden ml-auto"}>
          <button ref={toggleRef} type="button" aria-label={isOpen ? "Close Menu" : "Open Menu"} aria-expanded={isOpen} aria-controls="mobile-navigation" onClick={() => { setIsOpen(!isOpen); setExpanded(null); }} className={"text-white p-2"}>
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              fill={"none"}
              viewBox={"0 0 24 24"}
              strokeWidth={"1.5"}
              stroke={"currentColor"}
              className={"w-6 h-6"}
            >
              <path
                strokeLinecap={"round"}
                strokeLinejoin={"round"}
                d={"M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"}
              ></path>
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div id="mobile-navigation" className="md:hidden bg-[#142349] border-t border-black/10">
          <div className="max-w-screen-2xl mx-auto px-4 py-2 flex flex-col">
            {menuSections.map((section) => (
              <div className="border-b border-white/5" key={section.label}>
                <button type="button" aria-expanded={expanded === section.label} aria-controls={"mobile-" + section.label.toLowerCase()} onClick={() => setExpanded(expanded === section.label ? null : section.label)} className="flex items-center pb-4 pt-4 text-base font-semibold tracking-wide w-full justify-between text-white">
                  <span>{section.label}</span><span aria-hidden="true" className="text-sm">{expanded === section.label ? "−" : "+"}</span>
                </button>
                {expanded === section.label && (
                  <div id={"mobile-" + section.label.toLowerCase()} className="pb-3 pl-3">
                    {section.groups.map((group, index) => (
                      <div className="mb-2" key={index}>
                        {group.direct ? (
                          <a className="block text-sm leading-7 uppercase tracking-wide font-bold mb-2 text-white" href={group.direct.href} target={group.direct.target} rel={group.direct.target === "_blank" ? "noopener noreferrer" : undefined}>{group.direct.text}</a>
                        ) : (
                          <>
                            {group.title && <div className="text-white text-sm leading-7 uppercase tracking-wide font-bold mb-2">{group.title}</div>}
                            <ul className="space-y-1">
                              {group.links.map((link) => <li key={link.href}><a className="block px-4 py-2 text-base leading-7 rounded text-white" href={link.href} target={link.target} rel={link.target === "_blank" ? "noopener noreferrer" : undefined}>{link.text}</a></li>)}
                            </ul>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

