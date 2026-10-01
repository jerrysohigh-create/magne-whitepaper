import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('docs/review-v11-20260930');
const entries = JSON.parse(fs.readFileSync(path.join(root, 'image-inventory.json'), 'utf8'));
const lines = [
  '# v1.1 图片逐项审核登记', '',
  '2026-09-30 · 31 处正文配图 / 30 个独立文件 / 9 个章节 · 初审，尚未替换图片', '',
  '登记依据为当前正文图片清单及本轮页面截图。已检查各有图章节的桌面与手机页面样本，并对分配图、TEE 图和钱包图作补充截图；不等于逐张验证图片中的全部技术声明、软件版本或认证真伪。英文与繁体应共用图的事实内容，分别提供图注与文字说明。', '',
  '全部当前图片均缺少独立图注；繁体替代文本均为通用“MAGNE.AI 技術文件插圖”，不能表达各图内容。下面的尺寸是原始像素与本轮桌面实际显示宽度，不是建议统一使用的宽度。', '',
  '| # | 页面 / 图序 | 素材 | 原图尺寸 / 透明 | 当前显示宽 | 处置建议 |',
  '|---|---|---|---|---|---|',
];
function action(x) {
  const route = x.route;
  if (route.endsWith('/tokenomics')) return x.index === 1
    ? '缩小 MHA 图标，移到标题或代币概览旁；不占满正文。保留透明背景。'
    : '按原分配数据重建可读图表，配等价表格；中英文标签随语言切换。保留 100 亿总量及十项原比例，增加颜色之外的标签。';
  if (route.endsWith('/what-is-magne')) return '缩小品牌标识，放在对应层级标题旁；优先用文字解释职责。若重画整体关系图，须先确认 L1、L2、设备的实际关系，避免把规划功能画成现状。';
  if (route.endsWith('/hardware')) return [
    '',
    '用主站经确认的真实产品透明素材替换旧宣传拼图，靠近硬件简介；不添加白色底板，不生成虚构手机。保留自然比例与留白。',
    '规格从位图拆成可搜索的文字表；按批次核对 8 TOPS 等参数后再更新，不能直接套用主站数字。产品图与规格各自呈现。',
    '核对 N60 芯片、用途和认证覆盖范围；保留原图为来源附件，正文可做简明结构说明，不能把芯片认证扩大为整机认证。',
    '核对 72B 芯片、用途和认证范围；与上一图的分工写清楚，减少重复标识，补来源和适用硬件版本。',
    '核对 TEE 架构及认证范围后重排为清晰技术图；保留原件入口。加图注、缩写解释和文字等价说明，不伪造认证标志。',
  ][x.index];
  if (route.endsWith('/connect')) return x.index <= 7
    ? `桌面钱包流程图 ${x.index}：按当前支持网络核对步骤；只保留这一图对应的操作，裁去无关浏览器空白，保留字段上下文；提供原图查看和可复制配置。截图是否过时须另行核验。`
    : `钱包竖屏流程图 ${x.index - 7}：在整套步骤中确认必要性，删除重复步骤；限制桌面展示高度，手机端保持操作字段可读。补具体动作图注、钱包版本和网络；不猜测按钮或真实账户状态。`;
  if (route.endsWith('/explorer')) return `L${x.index} 浏览器整屏图改为功能重点截图并提供完整原图入口；补网络和截取日期。旧区块/交易数量只作历史界面示例，不冒充实时数据。`;
  if (route.endsWith('/magne-dapp')) return '缩小大幅 Shin Getter Nexus 标识；先确认品牌名称与规划状态。只有真实可用且授权的产品界面才替换进入正文，设计示意需显著注明。';
  if (route.endsWith('/l1') || route.endsWith('/l2')) return '缩小章节品牌图，靠近标题；只有能解释机制时才新增关系图。图中区分已部署组件与规划组件，避免装饰图替代架构说明。';
  if (route.endsWith('/mha')) return '缩小 MHA 图标并与概览信息并排；保留透明背景。币种、网络和合约信息用正文表达，不依赖图标识别。';
  throw new Error(`Unmapped ${route}`);
}
entries.forEach((x, i) => {
  const name = path.basename(x.source);
  lines.push(`| ${String(i + 1).padStart(2, '0')} | \`${x.route.replace('/tc', '')}\` / ${x.index} | [${name}](../..${x.source.replace('/sites/', '/public/sites/')}) | ${x.width} × ${x.height} / ${x.alpha ? '是' : '否'} | ${x.display[0]}px | ${action(x)} |`);
});
lines.push('', '## 全站配图原则', '',
  '1. 产品图使用官方真实素材，继续保留透明背景；不为了排版添加白色底板。',
  '2. 品牌标识控制体积；图片放在第一次解释它的段落附近，避免读者滚过大图才看到定义。',
  '3. 技术图先确认机制，再重绘；原始证据图保留来源入口。图解、截图、产品照片、认证材料应有明确区别。',
  '4. 图表与规格不能只存在于图片里；保留等价文字或表格，数值从同一份数据产生。',
  '5. 教程图片一步一动作；复杂图片支持查看原图，桌面不无限拉高，手机不把整张桌面屏幕压成细小文字。',
  '6. 每张图有针对性的替代文本；纯装饰图使用空替代文本。信息图具备编号、用途、来源/日期以及必要的状态说明。',
  '', '## 验收', '',
  '对 320/390/768/1440px 逐页检查图文间距、文字可读性、横向溢出和原图入口；确认 EN/TC 图注、单位、机制和数字一致。当前清单没有认定全部图片都要重做，具体取舍以图片是否提供有效信息为标准。', '',
  '总计划及截图：[REVIEW-PLAN.md](REVIEW-PLAN.md)。全部章节：[CHAPTER-REGISTER.md](CHAPTER-REGISTER.md)。', '');
fs.writeFileSync(path.join(root, 'IMAGE-REGISTER.md'), lines.join('\n'));
const summary = {placements: entries.length, uniqueFiles: new Set(entries.map(x => x.source)).size, chapters: new Set(entries.map(x => x.route)).size};
if (summary.placements !== 31 || summary.uniqueFiles !== 30 || summary.chapters !== 9) throw new Error('Inventory count changed');
const missing = [];
for (const name of ['REVIEW-PLAN.md', 'CHAPTER-REGISTER.md', 'IMAGE-REGISTER.md']) {
  const md = fs.readFileSync(path.join(root, name), 'utf8');
  for (const [, href] of md.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|#)/.test(href)) continue;
    if (!fs.existsSync(path.resolve(root, href))) missing.push(`${name}: ${href}`);
  }
}
console.log(JSON.stringify({summary, missing}, null, 2));
if (missing.length) process.exitCode = 1;
