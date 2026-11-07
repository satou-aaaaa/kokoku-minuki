// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の広告（答え）は入れず、遊び方の例だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:60px 70px;background:#f3eee4;color:#22263a;display:flex;gap:50px;align-items:center">
    <div style="flex:1">
      <div style="font-size:32px;color:#842c1b;letter-spacing:.08em">消費者庁の資料に基づく学習ゲーム</div>
      <div style="font-size:112px;font-weight:900;letter-spacing:.08em;color:#143866;margin-top:8px">広告<span style="color:#b3402a">みぬき</span></div>
      <div style="font-size:40px;margin-top:10px;line-height:1.5">ウソ・言いすぎの所はどこ？<br>1日5枚・時間制限なし</div>
    </div>
    <div style="width:420px;background:#fff;border:4px solid #22263a40;border-radius:24px;overflow:hidden;box-shadow:0 14px 30px #22263a33;transform:rotate(3deg)">
      <div style="background:#1f4f8a;color:#fff;font-size:24px;font-weight:900;padding:10px 20px">広告・架空</div>
      <div style="padding:22px;text-align:center">
        <div style="font-size:100px">🧴</div>
        <div style="font-size:56px;font-weight:900;color:#7a1f10;background:linear-gradient(transparent 62%,#ffe08a 62%);display:inline-block">満足度 No.1</div>
        <div style="font-size:22px;color:#4d5266;background:#f5f3ee;border-radius:10px;padding:10px;margin-top:16px;text-align:left">※だれに聞いた？ 何と比べた？</div>
      </div>
    </div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
