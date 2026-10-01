from pathlib import Path
p=Path('src/components/sites/web3-magne-ai-9982170f/shared/DocumentInteractions.tsx')
s=p.read_text(encoding='utf-8-sig').replace('export function DocumentInteractions({ html }: { html: string }) {','export function DocumentInteractions({ html, locale = "en" }: { html: string; locale?: "en" | "tc" }) {\n  const t = (en: string, tc: string) => locale === "tc" ? tc : en;')
pairs={
'No code block was found to copy.':'找不到可複製的程式碼區塊。',
'Copied to clipboard.':'已複製至剪貼簿。',
'Copied!':'已複製！',
'Copy':'複製',
'Clipboard access was unavailable. Select the code and copy it manually.':'無法存取剪貼簿，請選取程式碼後手動複製。',
'This network configuration is unavailable.':'此網絡設定暫不可用。',
'No compatible wallet was detected. Install or open MetaMask, then try again. You can also add the network manually using the values below.':'未偵測到相容錢包。請安裝或開啟 MetaMask 後重試，亦可使用下方資料手動新增網絡。',
'The wallet request was declined. No network change was confirmed.':'錢包請求已被拒絕，未確認任何網絡變更。',
'The wallet request could not be completed. Check your wallet or use the manual network configuration.':'未能完成錢包請求。請檢查錢包，或手動設定網絡。'
}
for en,tc in pairs.items():s=s.replace('"'+en+'"','t("'+en+'", "'+tc+'")')
s=s.replace('`Check your wallet to switch to ${network.chainName}.`','t(`Check your wallet to switch to ${network.chainName}.`, `請在錢包確認切換至 ${network.chainName}。`)')
s=s.replace('`Wallet switched to ${network.chainName}.`','t(`Wallet switched to ${network.chainName}.`, `錢包已切換至 ${network.chainName}。`)')
s=s.replace('`Check your wallet to add ${network.chainName}.`','t(`Check your wallet to add ${network.chainName}.`, `請在錢包確認新增 ${network.chainName}。`)')
s=s.replace('`${network.chainName} was added. Check the active network in your wallet.`','t(`${network.chainName} was added. Check the active network in your wallet.`, `已新增 ${network.chainName}，請檢查錢包目前使用的網絡。`)')
p.write_text(s,encoding='utf-8')
