"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Gen1Calculator } from "@/components/whitepaper/Gen1Calculator";
import { Gen1IncentiveCalculator } from "@/components/whitepaper/Gen1IncentiveCalculator";
import { withDocumentBasePath } from "@/lib/site-path";

type EthereumProvider = {
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const networks = [
  {
    chainId: "0x13500ba",
    chainName: "MAGNE L1 Testnet",
    rpcUrls: ["https://rpc.testnet.magicalhash.com"],
    blockExplorerUrls: ["https://explorer.testnet.magicalhash.com"],
    nativeCurrency: { name: "MHA", symbol: "MHA", decimals: 18 },
  },
  {
    chainId: "0x13500cb",
    chainName: "M Hash L2 Testnet",
    rpcUrls: ["https://l2-rpc.testnet.magicalhash.com"],
    blockExplorerUrls: ["https://l2-explorer.testnet.magicalhash.com"],
    nativeCurrency: { name: "MHA", symbol: "MHA", decimals: 18 },
  },
];

function errorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

export function DocumentInteractions({ html, locale = "en" }: { html: string; locale?: "en" | "tc" }) {
  const t = (en: string, tc: string) => locale === "tc" ? tc : en;
  const [status, setStatus] = useState("");
  const documentRoot = useRef<HTMLDivElement>(null);
  const [widgetHosts, setWidgetHosts] = useState<{base: Element | null; incentive: Element | null}>({base:null,incentive:null});
  const attachRoot = useCallback((node: HTMLDivElement | null) => {
    documentRoot.current = node;
    if (node) setWidgetHosts({base:node.querySelector('[data-gen1-widget="base"]'),incentive:node.querySelector('[data-gen1-widget="incentive"]')});
  }, []);

  useEffect(() => {
    const root = documentRoot.current;
    if (!root?.querySelector('.wp-allocation')) return;
    let frame = 0;
    let printState: Array<[HTMLDetailsElement, boolean]> = [];
    const reveal = (hash: string) => {
      if (!hash) return;
      let id: string;
      try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (!target || !root.contains(target)) return;
      let parent: Element | null = target;
      while (parent && root.contains(parent)) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
    };
    const hashChange = () => reveal(window.location.hash);
    const followLink = (event: globalThis.MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const url = new URL(link.href,window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) reveal(url.hash);
    };
    const beforePrint = () => {
      printState = [...root.querySelectorAll<HTMLDetailsElement>('details.wp-allocation, details.wp-allocation-table, details.gen1-reading-details')].map(group=>[group,group.open]);
      printState.forEach(([group])=>{group.open=true;});
    };
    const afterPrint = () => printState.forEach(([group,open])=>{group.open=open;});
    hashChange();
    window.addEventListener('hashchange',hashChange);
    document.addEventListener('click',followLink,true);
    window.addEventListener('beforeprint',beforePrint);
    window.addEventListener('afterprint',afterPrint);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange',hashChange);
      document.removeEventListener('click',followLink,true);
      window.removeEventListener('beforeprint',beforePrint);
      window.removeEventListener('afterprint',afterPrint);
    };
  }, [html, widgetHosts]);

  async function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("button[data-action]");
    if (!button || !event.currentTarget.contains(button)) return;
    event.preventDefault();

    if (button.dataset.action === "copy-address") {
      const address = button.dataset.address;
      if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return;
      try {
        await navigator.clipboard.writeText(address);
        setStatus(t("Address copied to clipboard.", "地址已複製至剪貼簿。"));
      } catch {
        setStatus(t("Select the full address and copy it manually.", "請選取完整地址並手動複製。"));
      }
      return;
    }
    if (button.dataset.action === "allocations-expand" || button.dataset.action === "allocations-collapse") {
      const open = button.dataset.action === "allocations-expand";
      event.currentTarget.querySelectorAll<HTMLDetailsElement>('details.wp-allocation').forEach(group=>{group.open=open;});
      setStatus(open ? t("All ten allocations expanded.", "十項分配已全部展開。") : t("All ten allocations collapsed.", "十項分配已全部收合。"));
      return;
    }

    if (button.dataset.action === "copy") {
      let container = button.parentElement;
      let code: HTMLElement | null = null;
      while (container && container !== event.currentTarget) {
        code = container.querySelector<HTMLElement>("pre code, code, pre");
        if (code) break;
        container = container.parentElement;
      }
      if (!code) {
        setStatus(t("No code block was found to copy.", "找不到可複製的程式碼區塊。"));
        return;
      }
      try {
        await navigator.clipboard.writeText(code.textContent ?? "");
        setStatus(t("Copied to clipboard.", "已複製至剪貼簿。"));
        button.textContent = t("Copied!", "已複製！");
        window.setTimeout(() => { if (button.isConnected) button.textContent = t("Copy", "複製"); }, 1800);
      } catch {
        setStatus(t("Clipboard access was unavailable. Select the code and copy it manually.", "無法存取剪貼簿，請選取程式碼後手動複製。"));
      }
      return;
    }

    if (button.dataset.action !== "add-network") return;
    const index = button.dataset.chain;
    const network = index === "0" ? networks[0] : index === "1" ? networks[1] : undefined;
    if (!network) {
      setStatus(t("This network configuration is unavailable.", "此網絡設定暫不可用。"));
      return;
    }
    const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      setStatus(t("No compatible wallet was detected. Install or open MetaMask, then try again. You can also add the network manually using the values below.", "未偵測到相容錢包。請安裝或開啟 MetaMask 後重試，亦可使用下方資料手動新增網絡。"));
      return;
    }
    button.disabled = true;
    setStatus(t(`Check your wallet to switch to ${network.chainName}.`, `請在錢包確認切換至 ${network.chainName}。`));
    try {
      try {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: network.chainId }] });
        setStatus(t(`Wallet switched to ${network.chainName}.`, `錢包已切換至 ${network.chainName}。`));
      } catch (error: unknown) {
        if (errorCode(error) !== 4902) throw error;
        setStatus(t(`Check your wallet to add ${network.chainName}.`, `請在錢包確認新增 ${network.chainName}。`));
        await provider.request({ method: "wallet_addEthereumChain", params: [network] });
        setStatus(t(`${network.chainName} was added. Check the active network in your wallet.`, `已新增 ${network.chainName}，請檢查錢包目前使用的網絡。`));
      }
    } catch (error: unknown) {
      setStatus(errorCode(error) === 4001
        ? t("The wallet request was declined. No network change was confirmed.", "錢包請求已被拒絕，未確認任何網絡變更。")
        : t("The wallet request could not be completed. Check your wallet or use the manual network configuration.", "未能完成錢包請求。請檢查錢包，或手動設定網絡。"));
    } finally {
      button.disabled = false;
    }
  }

  return (
    <>
      <div className="site-document" ref={attachRoot} onClick={handleClick} dangerouslySetInnerHTML={{ __html: withDocumentBasePath(html) }} />
      {widgetHosts.base && createPortal(<Gen1Calculator locale={locale} />, widgetHosts.base)}
      {widgetHosts.incentive && createPortal(<Gen1IncentiveCalculator locale={locale} />, widgetHosts.incentive)}
      <div role="status" aria-live="polite" aria-atomic="true" className="document-status">
        {status}
      </div>
    </>
  );
}
