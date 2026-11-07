// アプリのアイコン（icon-192.png・icon-512.png）を作る。生成りの地に、広告の札「No.1」と虫めがね。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#f3eee4"/>
      <rect x="14" y="20" width="56" height="44" rx="6" fill="#fff" stroke="#22263a" stroke-width="2.5"/>
      <rect x="14" y="20" width="56" height="10" rx="5" fill="#1f4f8a"/>
      <text x="42" y="52" font-size="17" text-anchor="middle" fill="#7a1f10" font-family="sans-serif" font-weight="900">No.1</text>
      <rect x="20" y="56" width="30" height="3" rx="1.5" fill="#22263a55"/>
      <circle cx="64" cy="62" r="15" fill="#ffffffcc" stroke="#b3402a" stroke-width="5"/>
      <path d="M75 73 L88 86" stroke="#b3402a" stroke-width="8" stroke-linecap="round"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
