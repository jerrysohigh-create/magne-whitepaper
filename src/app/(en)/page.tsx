import { WhitepaperHome } from "@/components/whitepaper/WhitepaperHome";
import { withBasePath } from "@/lib/site-path";
export const metadata = {alternates:{languages:{en:withBasePath("/"),"zh-Hant":withBasePath("/tc/")}}};
export default function Home() { return <WhitepaperHome />; }
