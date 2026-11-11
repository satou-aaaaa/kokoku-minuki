// 広告みぬきの検査。広告の作り方（13種類×3000枚：押せる所・答えが1つ・中身が空でない・同じ種で同じ広告）・今日の5枚と上級の組み方（3年分）・
// とことんの並び（何百回作って1回の中で重ならない）・通しで遊ぶ・まちがい・ヒント・続きから・上級・練習・とことん・見抜き帳・実績・
// カレンダー・あとから・古いタブ・スマホ幅・PWA・引き継ぎコード・見やすさを確かめる。
// 使い方: node qa/run.mjs   失敗があれば終了コード 1。結果は qa-report/report.md。
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import { checkTransfer } from "./transfer-check.mjs";
import { checkSwStall } from "./sw-check.mjs";
import { checkDepth } from "./depth-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail: String(detail).slice(0, 400) });
const G = createRequire(import.meta.url)(path.join(root, "gen.js"));

// ---- 1. 広告の作り方（ブラウザを使わない）----
{
  const bad = {}, keys = new Set(), N = 3000, okN = {}, srcs = new Set(Object.keys(G.SRC));
  for (const k of G.KINDS) {
    okN[k.id] = 0;
    for (let s = 0; s < N; s++) {
      const P = G.make(`${k.id}|qa${s}`), why = [];
      if (!P.parts || P.parts.length < 4 || P.parts.length > 5) why.push("押せる所が4〜5でない");
      if (P.ok ? P.ans !== -1 : !(P.ans >= 0 && P.ans < P.parts.length)) why.push("答えの番号がおかしい");
      if (!P.ok && !["head", "price", "body", "tags"].includes(P.parts[P.ans].t)) why.push("答えが大きな字・値段・本文・ハッシュタグでない");
      const txt = JSON.stringify(P);
      if (/undefined|NaN|null|\[object/.test(txt)) why.push("中身が空");
      if (P.parts.some((x) => !x.text || [...x.text].length > 70)) why.push("部品の文が空か70字より長い");
      if ([...P.why].length > 80 || [...P.fix].length > 60 || [...k.look].length > 45) why.push("説明が長い（説明80字・直し方60字・ヒント45字まで）");
      if (!G.RULES[P.rule] || !srcs.has(P.src)) why.push("決まりの分け方・出典が無い");
      if (JSON.stringify(G.make(`${k.id}|qa${s}`)) !== txt) why.push("同じ種で同じ広告にならない");
      if (P.ok) okN[k.id]++;
      keys.add(P.key);
      if (why.length && !bad[k.id]) bad[k.id] = why.join("・") + "：" + P.parts.map((x) => x.text).join(" / ");
    }
  }
  check(`広告：${G.KINDS.length}種類×${N}枚で、押せる所4〜5・答えは1つ・中身が空でない・同じ種で同じ広告`, Object.keys(bad).length === 0, JSON.stringify(bad));
  const ratio = Object.entries(okN).filter(([, n]) => n < N * 0.2 || n > N * 0.4);
  check("練習・とことんの「問題なし」は、どの種類も2〜4割（ウソばかり・問題なしばかりにならない）", ratio.length === 0, JSON.stringify(ratio));
  check("種類は13（やさしい4・ふつう5・むずかしい4）で、3つの決まり（品質・値段・かくれた広告）が全部ある", G.KINDS.length === 13 && [0, 1, 2].map((l) => G.kindsOf(l).length).join() === "4,5,4" && new Set(G.KINDS.map((k) => k.rule)).size === 3);
  check("ちがう広告は300種類よりずっと多い（好きなだけ遊べるように）", keys.size > 3000, `${keys.size}種類`);
  check("出典はすべて消費者庁（caa.go.jp）", Object.values(G.SRC).every((x) => /^https:\/\/www\.caa\.go\.jp\//.test(x[1])));
  // 実在の会社名をまねない（架空の屋号はひらがな）
  check("お店は架空の屋号（ひらがな）だけ", G.SHOPS.every(([n]) => /^[ぁ-ん]+(堂|生活|商会|屋|通販|電機|化粧品|食品)$/.test(n)));
}
{
  // 今日の5枚・上級の組み方（3年分）
  const bad = [], cover = new Set(); let sameAsPrev = 0, prev = "";
  const d0 = Date.parse("2026-11-07");
  for (let i = 0; i < 365 * 3; i++) {
    const d = new Date(d0 + i * 864e5).toISOString().slice(0, 10), dl = G.dailyTags(d), hl = G.hardTags(d);
    const dk = dl.map((t) => t.split("|")[0]), hk = hl.map((t) => t.split("|")[0]), dOk = dl.map(G.make).filter((p) => p.ok).length, hOk = hl.map(G.make).filter((p) => p.ok).length;
    if (dl.length !== 5 || new Set(dk).size !== 5 || dk.map((k) => G.BY[k].lv).join() !== "0,0,1,1,2" || dOk < 1 || dOk > 2) bad.push(d + " 今日");
    if (hl.length !== 3 || new Set(hk).size !== 3 || hk.some((k) => G.BY[k].lv < 1 || dk.includes(k)) || hOk > 1) bad.push(d + " 上級");
    if (JSON.stringify(dl) !== JSON.stringify(G.dailyTags(d))) bad.push(d + " 同じにならない");
    if (dk.join() === prev) sameAsPrev++; prev = dk.join();
    if (i < 60) [...dk, ...hk].forEach((k) => cover.add(k));
  }
  check("今日の5枚（やさしい2・ふつう2・むずかしい1・種類は重ねない・問題なし1〜2枚）と上級（ふつう・むずかしいから3枚・今日と別の種類・問題なし0〜1枚）を3年分作れる", bad.length === 0, bad.slice(0, 5).join(","));
  check("2か月のうちに13種類が全部出る・前の日と同じ組の日が少ない", cover.size === 13 && sameAsPrev < 20, `${cover.size}種類・前の日と同じ ${sameAsPrev}日`);
  // 過去の日の広告を変えない：はじめの日の5枚を固定して見る（gen.js を変えて変わったら、PR に一言書いてからここを直す）
  check("第1回（2026-11-07）の5枚が変わっていない", G.dailyTags("2026-11-07").join() === "stema|2026-11-07:d0|x,nijuu|2026-11-07:d1|o,kigen|2026-11-07:d2|x,muryo|2026-11-07:d3|x,konkyo|2026-11-07:d4|x");
  // 中身（店・商品・押せる所の文・答え・メモ）まで固定値と比べる（2026-11-07 CodeRabbit）
  const day1 = createHash("sha256").update(JSON.stringify(G.dailyTags("2026-11-07").map(G.make).map((p) => [p.kind, p.shop, p.prod, p.parts.map((x) => x.text), p.ans, p.memo || ""]))).digest("hex").slice(0, 16);
  check("第1回（2026-11-07）の5枚の中身と答えが変わっていない", day1 === "4f868de38da16c18", day1);
}

// ---- 2. ファイルの中身 ----
const html = readFileSync(path.join(root, "index.html"), "utf8"), gen = readFileSync(path.join(root, "gen.js"), "utf8");
const ext = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https:\/\/fonts\.googleapis\.com(\/|$)|^https:\/\/ko-fi\.com\/satouaaaaa$/.test(u));
check("外から読むのは文字（Google Fonts）だけ。スクリプト・広告・解析を入れない（出典のリンクは押したときに開くだけ）", ext.length === 0 && ![...html.matchAll(/<script[^>]+src="([^"]+)"/g)].some((m) => /^https?:/.test(m[1])), ext.join(","));
check("CSP で通信先を自分だけにしている", /connect-src 'self'/.test(html) && !/connect-src[^;"]*https/.test(html));
check("Math.random は練習・とことんの種だけ（今日の5枚・上級は日付の乱数。gen.js には無い）", (html.match(/Math\.random/g) || []).length === 2 && !/Math\.random/.test(gen));
check("乱数は sort の比較の中で引かない（ブラウザで引く回数が変わる）", !/\.sort\(\s*\([^)]*\)\s*=>[^\n;]*\b(R|rng|rand|Math\.random)\s*\(/.test(html + gen));
check("一行の式の途中にコメント // を足さない（行の残りが消える。rosen-hitofude 2026-11-04）", !/;\s*\/\/[^\n]*;\s*\w/.test(gen.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n")));
check("画面にお笑いの言葉を入れない（本物っぽく）", !/お笑い|ギャグ|ツッコミ|なんでやねん|（うそ）/.test(html + gen));
check("チケット・回数制限・🔒で開くモードを入れない（好きなだけ遊べる）", !/🎫|チケット|すると開く|🔒/.test(html));
check("引き継ぎ：transfer.js をゲームの script より前に、このゲームの記録のキー（記録と復習）だけで読む・depth.js も前に読む", /<script src="transfer\.js" data-game="kokoku-minuki" data-keys="kokoku-v1,kokoku-depth"><\/script>\s*<script src="depth\.js" data-game="kokoku-minuki" data-key="kokoku-depth"><\/script>\s*<\/head>/.test(html) && html.indexOf('src="transfer.js"') < html.indexOf('src="gen.js"') && /data-hk/.test(html) && existsSync(path.join(root, "transfer.js")));
{ const og = (k) => (html.match(new RegExp(`<meta (?:property|name)="${k}" content="([^"]+)"`)) || [])[1] || "";
  const png = readFileSync(path.join(root, "og.png"));
  check("SNS で貼ると絵と題が出る（OGP・1200×630・絶対URL）", og("og:title") && og("og:description") && og("og:image") === "https://satou-aaaaa.github.io/kokoku-minuki/og.png" && og("twitter:card") === "summary_large_image" && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630); }
{ const fy = readFileSync(path.join(root, ".github/ISSUE_TEMPLATE/feedback.yml"), "utf8");
  check("感想フォームの name が3字以上（2字だとフォームが出ない）", [...((fy.match(/^name:\s*(.+)$/m) || [])[1] || "").trim()].length >= 3);
  check("感想フォームは名前・メールを聞かない", !/id: (name|email|mail)/.test(fy)); }
check("README の URL のすぐ後ろに全角の字を続けない（Link check が URL の一部と読む）", !/https?:\/\/[\x21-\x7e]*[^\x00-\x7f]/.test(readFileSync(path.join(root, "README.md"), "utf8").replace(/\]\(https?:\/\/[^)\s]+\)/g, "").replace(/<https?:\/\/[^>\s]+>/g, "")));
{ const sw = readFileSync(path.join(root, "sw.js"), "utf8"), mf = JSON.parse(readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  { const st = await checkSwStall(sw); check("PWA：通信が止まっても4秒ほどで保存した画面に切り替わり、少しずつ届く受信は待ち、何も無ければ60秒で返す（shared-workflows template/qa/sw-check.mjs）", st.ok, JSON.stringify(st)); }
  const shell = JSON.parse(sw.match(/SHELL = (\[[^\]]+\])/)[1]);
  check("PWA：sw.js は画面のファイルを全部保存し（引き継ぎの transfer.js も）、取り直して入れ、外へ何も送らない", ["./index.html", "./gen.js", "./transfer.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"].every((f) => shell.includes(f)) && /cache: "reload"/.test(sw) && !/https?:\/\//.test(sw.replace(/^\/\/.*$/gm, "")));
  check("PWA：?付きの URL も同じ場所に保存し、自分の版からだけ探す（中身は shared-workflows template/sw.js。止まったときの動きは下の checkSwStall が見る）", /c\.put\(url\.pathname/.test(sw) && /caches\.open\(CACHE\)/.test(sw));
  check("PWA：manifest にアイコン2つと名前がある", mf.name === "広告みぬき" && mf.icons.length >= 2 && mf.start_url === "./"); }

// ---- 3. ブラウザで遊ぶ ----
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = createServer((req, res) => {
  let p; try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch (e) { res.writeHead(400); return res.end(); }
  const f = path.join(root, p === "/" ? "index.html" : p), rel = path.relative(root, f);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0, "127.0.0.1"); // 外から読めないよう、自分の機械だけで待つ
await new Promise((ok) => server.once("listening", ok));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const dayBefore = (n) => new Date(Date.parse(TODAY) - n * 864e5).toISOString().slice(0, 10);
async function newPage(w = 390, ctx) {
  const c = ctx || await browser.newContext({ viewport: { width: w, height: 800 } });
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(200);
  return p;
}
const closeHow = async (p) => { if (await p.locator("#howto[open]").count()) await p.click("#howto-ok"); };
const sel = (j) => (j === -1 ? "#okbtn" : `.pt[data-j="${j}"]`);
const ansIdx = (p) => p.evaluate(() => __km.cur().P.ans);
const wrongIdx = (p) => p.evaluate(() => { const c = __km.cur(), all = [...c.P.parts.map((_, j) => j), -1]; return all.find((j) => j !== c.P.ans && !c.wrong.includes(j)); });
const mem = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("kokoku-v1") || "{}"));
// 2段目（どの決まり？）が出たら、正しい決まりを選ぶ
const why = async (p) => { await p.waitForSelector(".verdict, .why button"); if (await p.locator(".verdict").count()) return; await p.click(`.why button[data-r="${await p.evaluate(() => __km.cur().P.rule)}"]`); };
async function solve(p, { wrong = 0 } = {}) {
  for (let i = 0; i < wrong; i++) await p.click(sel(await wrongIdx(p)));
  await p.click(sel(await ansIdx(p)));
  await why(p);
  await p.waitForSelector(".verdict");
}

try {
  const p = await newPage();
  check("はじめて開くと遊び方が出る", await p.locator("#howto[open]").count() === 1);
  await p.click("#howto-ok");
  check("ホームに今日のコツが出る・上級・とことん・練習ははじめから押せる", (await p.textContent("#tip")).includes("今日のコツ") && await p.locator("#go-h:not([disabled])").count() === 1 && await p.locator("#go-e").count() === 1 && await p.locator("#go-p").count() === 1);

  // 今日の5枚：1枚目はまちがえる、2枚目はヒント2回、ほかはそのまま
  await p.click("#go-d");
  const tags = await p.evaluate(() => __km.load().runs.d.list);
  check("今日の5枚は日付から決まる（gen.js の dailyTags と同じ）", JSON.stringify(tags) === JSON.stringify(G.dailyTags(TODAY)));
  check("広告の画面：押せる所4〜5と「問題なし」・どれも読み上げ用の名前がある", (await p.locator(".pt").count()) >= 4 && await p.locator("#okbtn").count() === 1 && (await p.$$eval(".pt", (b) => b.filter((x) => !x.getAttribute("aria-label")).length)) === 0);
  check("広告は「架空」と出す", (await p.textContent("#ad")).includes("架空"));
  await p.click(sel(await wrongIdx(p)));
  check("まちがえると ✕ の印と「ちがう」の文字（色だけで分けない）・知らせは role=status", await p.locator(".ng").count() === 1 && /ちがう/.test(await p.evaluate(() => getComputedStyle(document.querySelector(".ng"), "::after").content)) && (await p.textContent("#msg")).includes("✕") && await p.getAttribute("#msg", "role") === "status");
  await p.reload(); await p.waitForTimeout(150); await p.click("#go-d");
  check("途中で閉じても続きから（同じ広告・まちがえた印のまま）", await p.locator(".ng").count() === 1 && await p.evaluate(() => __km.cur().i) === 0);
  await solve(p);
  check("正しく見抜くと ✓ の印・決まりの名前・説明・出典（消費者庁）・★2（まちがい1回）", await p.locator(".pt.ok, .okbtn.ok").count() === 1 && (await p.textContent(".verdict")).length > 30 && /caa\.go\.jp/.test(await p.getAttribute(".verdict .src a", "href")) && (await p.getAttribute(".verdict .stars", "aria-label")) === "星2つ");
  await p.click("#next");
  await p.click("#hint");
  check("ヒント1は見るところを言う（答えは言わない）", (await p.textContent("#hintbox")).includes("💡") && await p.locator(".ng").count() === 0);
  await p.click("#hint");
  const left = await p.evaluate(() => [...document.querySelectorAll(".pt,#okbtn")].filter((b) => !b.disabled).length);
  check("ヒント2はちがう所を消し、2つにしぼる・ヒントは2回まで", left === 2 && await p.locator("#hint:disabled").count() === 1, left);
  await p.evaluate(() => { const c = __km.cur(); [...document.querySelectorAll(".pt,#okbtn")].find((b) => !b.disabled && +b.dataset.j !== c.P.ans).click(); });
  await p.waitForTimeout(50);
  { const n = await p.evaluate(() => [...document.querySelectorAll(".pt,#okbtn")].filter((b) => !b.disabled).length);
    check("ヒント2のあとに残ったまちがいを押すと、正解だけが残る（消した所が戻らない。shared-workflows incidents/2026-11-07-hint-cut-comes-back.md）", n === 1, n); }
  await solve(p);
  check("ヒント2回は★1", (await p.getAttribute(".verdict .stars", "aria-label")) === "星1つ");
  await p.click("#next");
  check("次の広告へ進むと、フォーカスが問い（#ask）に移る", await p.evaluate(() => document.activeElement && document.activeElement.id) === "ask");
  for (let i = 2; i < 5; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  const s1 = await mem(p);
  check("5枚で結果：今日の記録に1枚ごとのまちがい（1・3・0・0・0）", JSON.stringify(s1.days[TODAY]?.m) === "[1,3,0,0,0]");
  const share = await p.textContent(".share");
  check("シェアの文に広告の中身・答えを出さない（印だけ）", /第\d+回/.test(share) && /🟢/.test(share) && !G.KINDS.some((k) => share.includes(k.name)) && !/円|No\.1|PR/.test(share), share);
  check("まちがいのある日は Ko-fi の一言を出さない", await p.locator(".kofi").count() === 0);
  check("結果に「今日わかった決まり」「あと少しの実績」と、続けて遊ぶ・上級のボタン", (await p.locator(".rlist div").count()) === 5 && await p.locator("#achnext").count() === 1 && await p.locator("#go-e").count() === 1 && await p.locator("#go-h").count() === 1);
  check("見抜き帳に調べた種類が載る", Object.keys(s1.dex).length === 5);
  await p.click("#back");
  check("今日を終えたら、ホームは「今日の結果を見る」", (await p.textContent("#go-d")).includes("結果"));
  // 上級：ヒントなし・3枚
  await p.click("#go-h");
  check("上級はヒントのボタンが無い・3枚", await p.locator("#hint").count() === 0 && (await p.evaluate(() => __km.load().runs.h.list.length)) === 3);
  for (let i = 0; i < 3; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  check("上級の記録は hdays に入る", (await mem(p)).hdays[TODAY]?.m.length === 3);
  // 練習：記録を増やさない
  await p.click("#back"); await p.click("#go-p"); await p.click('.lv button[data-t="2"]');
  const before = await mem(p);
  for (let i = 0; i < 5; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  const after = await mem(p);
  check("練習は今日の記録を増やさない（見抜き帳の数はふえる）", JSON.stringify(after.days) === JSON.stringify(before.days) && Object.values(after.dex).reduce((a, b) => a + b) === Object.values(before.dex).reduce((a, b) => a + b) + 5);
  await p.click("#back"); await p.click("#go-dex");
  const firstKind = await p.getAttribute(".book button", "data-k");
  await p.click(".book button");
  const pl = await p.evaluate(() => __km.load().runs.p.list);
  check("見抜き帳の決まりを押すと、その決まりだけで5枚・同じ広告は出ない", pl.length === 5 && pl.every((t) => t.startsWith(firstKind + "|")) && new Set(pl.map(G.keyOf)).size === 5);
  // とことん：まちがえても続く・「ここで降りる」で終わる・自己ベストは一度で見抜いた数
  await p.click("#back"); await p.goto(url); await p.waitForTimeout(150); await p.click("#go-e");
  check("とことんはヒントを何度でも使える（🎫・🌸のような数の縛りが無い）", await p.locator("#hint:not([disabled])").count() === 1 && await p.locator("#quit").count() === 1 && !(await p.textContent("#app")).match(/🎫|🌸/));
  await solve(p); await p.click("#next"); await solve(p); await p.click("#next");
  await solve(p, { wrong: 2 }); await p.click("#next");
  for (let i = 0; i < 4; i++) await p.click(sel(await wrongIdx(p))).catch(() => {});
  check("とことんはまちがえても終わらない", await p.locator(".verdict").count() === 0 && await p.locator("#quit").count() === 1);
  await solve(p); await p.click("#next");
  // 並びを使い切る前に足す
  await p.evaluate(() => __km.save((s) => { s.runs.e.res = s.runs.e.res.concat(Array.from({ length: s.runs.e.list.length - 6 }, () => ({ m: 1 }))); s.runs.e.cur = null; }));
  await p.evaluate(() => __km.play("e")); await p.waitForTimeout(100);
  const el = await p.evaluate(() => __km.load().runs.e.list);
  check("とことんは並びを使い切る前に足して続く（足した分とも重ならない）", el.length > 46 && new Set(el.map(G.keyOf)).size === el.length, el.length);
  await p.click("#quit"); await p.waitForTimeout(150);
  check("「ここで降りる」で終わり、自己ベストは一度で見抜いた数（2枚）", (await mem(p)).ebest === 2 && (await p.textContent("#ebest")).includes("一度で見抜いた 2枚") && !(await mem(p)).runs.e);
  {
    // 引き継ぎコードなどで数の所に文字が入っても、画面に HTML として出さない
    const q = await newPage(); await closeHow(q);
    await q.evaluate(() => { const s = JSON.parse(localStorage.getItem("kokoku-v1")) || { v: 1 }; s.ebest = '<img id="xss" src=x>'; s.okc = "x"; s.dex = { no1img: '"><b id="xss2">' }; s.runs = { h: { list: "bad", res: [] }, p: { mode: "p", id: "y", date: "2026-11-07", list: ["constructor|1"], res: [] }, d: { mode: "d", id: "z", date: "x", list: ["no1img|1"], res: [] }, "a:2026-11-07": { mode: "a", id: "a3", date: "2026-11-07", list: ["no1img|1", "nijuu|2"], res: [{ m: 0 }], cur: { i: 1, tag: "nijuu|2", wrong: "x", hints: 0 } } }; s.days = { "2026-11-07": { m: "x" }, bad: { m: [0] }, "2026-02-30": { m: [0] } }; localStorage.setItem("kokoku-v1", JSON.stringify(s)); });
    await q.evaluate(() => { const s = JSON.parse(localStorage.getItem("kokoku-v1")); s.runs.zz = { mode: "zz", id: "q", date: "2026-11-07", list: ["no1img|1"], res: [] }; s.runs.e = { mode: "e", id: "old-e", date: "2026-11-07", list: ["no1img|1"], res: [] }; s.edone = { "old-e": 1 }; localStorage.setItem("kokoku-v1", JSON.stringify(s)); });
    await q.reload(); await q.waitForTimeout(250);
    const st = await q.evaluate(() => __km.load());
    check("知らないモードの途中経過と、終えたとことんの回は戻さない（「もう一度とことん」で新しい回になる）", !("zz" in st.runs) && !("e" in st.runs) && st.edone["old-e"] === 1);
    check("記録の形を直す：数の所の文字は0に・形のちがう途中経過と日ごとの記録は捨てる", st.ebest === 0 && st.okc === 0 && st.dex.no1img === 0 && !("h" in st.runs) && !("p" in st.runs) && !("d" in st.runs) && st.runs["a:2026-11-07"] && st.runs["a:2026-11-07"].cur === null && Object.keys(st.days).length === 0);
    check("記録の文字を HTML として出さない", await q.locator("#xss, #xss2").count() === 0);
    await q.context().close();
  }
  await p.click("#back"); await p.click("#go-ach");
  check("実績は14個で、腕前・集める・続けるの3つの組", await p.locator(".ach").count() === 14 && await p.locator(".agrp").count() === 3 && await p.locator(".ach.got").count() >= 3);
  check("達成した実績は ✓ の文字も付く（色だけで分けない）", (await p.textContent(".ach.got b")).startsWith("✓"));
  await p.click("#back"); await p.click("#f-about");
  check("このゲームについて：3つの決まり・消費者庁の出典・架空・法律相談ではない・188", (await p.textContent("#about")).includes("架空") && (await p.textContent("#about")).includes("188") && await p.locator('#about a[href^="https://www.caa.go.jp/"]').count() === Object.keys(G.SRC).length);
  await p.context().close();

  // まちがいなしの日は Ko-fi を1回だけ
  {
    const q = await newPage(); await closeHow(q); await q.click("#go-d");
    for (let i = 0; i < 5; i++) { await solve(q); await q.click("#next"); }
    await q.waitForTimeout(150);
    check("全部まちがいなしで初めて終えたときだけ Ko-fi の一言", await q.locator(".kofi").count() === 1 && (await q.textContent(".big")).includes("まちがいなし"));
    check("「問題なし」を一度で見分けた数が残る", (await mem(q)).okc === G.dailyTags(TODAY).map(G.make).filter((x) => x.ok).length);
    await q.click("#back"); await q.click("#go-d");
    check("結果をもう一度見ても Ko-fi は出さない", await q.locator(".kofi").count() === 0);
    await q.context().close();
  }

  // カレンダー・あとから
  {
    const q = await newPage();
    await q.evaluate(([d2, d3]) => { localStorage.setItem("kokoku-v1", JSON.stringify({ v: 1, tut: true, days: { [d2]: { m: [0, 0, 0, 0, 0], k: [] }, [d3]: { m: [1, 0, 0, 2, 0], k: [] } }, hdays: {}, adays: {}, dex: {}, runs: {}, kofi: {}, ach: {}, ebest: 0 })); }, [dayBefore(2), dayBefore(3)]);
    await q.reload(); await q.waitForTimeout(150);
    check("ホームの「続けて」は、きのうを休んだら — （休んだ日を責めない）", (await q.textContent(".stats")).includes("—"));
    await q.click("#go-cal");
    const lateList = await q.evaluate(() => __km.lateDays(__km.load()));
    const exp = [1, 4, 5, 6, 7].map(dayBefore).filter((d) => d >= "2026-11-07");
    check("カレンダー：取りこぼした過去7日（第1回より後）を押せる", JSON.stringify(lateList) === JSON.stringify(exp), lateList.join(","));
    if (lateList.length) {
      const d = lateList[0];
      if (!(await q.locator(`.cal .miss[data-k="${d}"]`).count())) await q.click("#prev");
      await q.click(`.cal .miss[data-k="${d}"]`);
      check("あとから：その日の今日の5枚と同じ広告", JSON.stringify(await q.evaluate((d) => __km.load().runs["a:" + d].list, d)) === JSON.stringify(G.dailyTags(d)));
      for (let i = 0; i < 5; i++) { await solve(q); await q.click("#next"); }
      await q.waitForTimeout(150);
      const s = await mem(q);
      check("あとからは adays に入り、今日の記録・続けた日には数えない", s.adays[d] && !s.days[d] && (await q.locator(".share").count()) === 0 && (await q.locator(".kofi").count()) === 0);
    } else {
      // 第1回の日（公開した日）は、まだ取りこぼした日が無い。日付をずらして同じことを見る
      const r = await q.evaluate(() => { const s = __km.load(); return __km.lateDays(s, "2026-11-12"); });
      check("あとから：第1回より前の日は出さず、過去7日の遊んでいない日を出す（11/12 の目で見る）", JSON.stringify(r) === JSON.stringify(["2026-11-11", "2026-11-10", "2026-11-09", "2026-11-08", "2026-11-07"].filter((d) => d !== dayBefore(2) && d !== dayBefore(3))), r.join(","));
    }
    await q.context().close();
  }

  // 古いタブ：同じ広告を2つのタブで開き、片方で答えたら、もう片方は二重に入れない
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const a = await newPage(390, ctx); await closeHow(a); await a.click("#go-d");
    const b = await ctx.newPage(); b.on("pageerror", (e) => errors.push(e.message)); await b.goto(url); await b.waitForTimeout(150); await b.click("#go-d");
    await solve(a);
    await b.click(sel(await ansIdx(b)));
    await b.waitForTimeout(200);
    const s = await mem(a);
    check("古いタブで同じ広告に答えても二重に数えない", s.runs.d.res.length === 1 && Object.values(s.dex).reduce((x, y) => x + y) === 1);
    await a.click("#next"); await b.goto(url); await b.waitForTimeout(150); await b.click("#go-d");
    await a.click("#hint"); await a.click("#hint");
    await b.click("#hint");
    check("別のタブで使ったヒントの数を減らさない", (await mem(a)).runs.d.cur.hints === 2);
    await ctx.close();
  }
  // 古いタブでヒントなしに答えても、別のタブで先に使ったヒントを★に数える
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const a = await newPage(390, ctx); await closeHow(a); await a.click("#go-d");
    const b = await ctx.newPage(); b.on("pageerror", (e) => errors.push(e.message)); await b.goto(url); await b.waitForTimeout(150); await b.click("#go-d");
    await a.click("#hint");
    await b.click(sel(await ansIdx(b))); await b.waitForTimeout(150);
    const r = (await mem(b)).runs.d.res;
    check("別のタブで先に使ったヒントも★に数える（ヒントなしの★3にしない）", r.length === 1 && r[0].m === 1 && (await b.getAttribute(".verdict .stars", "aria-label")) === "星2つ");
    await ctx.close();
  }
  // 前の日に5枚とも答えたまま結果を見ていない回は、次の日を始めるときに記録する
  {
    const q = await newPage(); await closeHow(q);
    const y = await q.evaluate(() => { const d = new Date(Date.parse(__km.todayKey() + "T00:00:00Z") - 864e5).toISOString().slice(0, 10); const s = __km.load(); const list = __km.G.dailyTags(d); s.runs.d = { mode: "d", date: d, list, res: list.map(() => ({ m: 0 })), cur: null, id: "yd" }; localStorage.setItem("kokoku-v1", JSON.stringify(s)); return d; });
    await q.click("#go-d"); await q.waitForTimeout(150); // ホームを開いたままのタブで、別のタブが前の日の最後の1枚を終えたあとに今日を始める
    const s = await mem(q);
    check("前の日に終えたまま結果を見ていない回も、カレンダーに残る", JSON.stringify(s.days[y]?.m) === "[0,0,0,0,0]" && s.runs.d.date !== y);
    await q.close();
  }

  // 1問を深くする（shared-workflows routines/game-dev.md「1問を深くする」）：自信をかける・2段目「どの決まり？」・復習
  {
    const q = await newPage(); await closeHow(q);
    const lie = G.KINDS.find((k) => !G.make(`${k.id}|d1|x`).ok);
    const okTag = G.KINDS.map((k) => `${k.id}|d2|o`).find((t) => G.make(t).ok);
    await q.evaluate((tags) => __km.save((s) => { s.runs.p = { mode: "p", date: __km.todayKey(), list: tags, res: [], cur: null, id: "dp" }; }), [`${lie.id}|d1|x`, `${lie.id}|d3|x`, okTag]);
    await q.evaluate(() => { Depth.runStart(); __km.play("p"); });
    const sb = await q.$eval("#dp-sure", (b) => [b.getBoundingClientRect().height, b.getAttribute("aria-pressed"), b.textContent]);
    check("自信のボタン：高さ44px以上・はじめは押していない", sb[0] >= 44 && sb[1] === "false", sb.join(","));
    await q.click("#dp-sure");
    check("自信のボタンを押すと ✓ が出る（色だけで分けない）", (await q.getAttribute("#dp-sure", "aria-pressed")) === "true" && (await q.textContent("#dp-sure")).includes("✓"));
    await q.click(sel(await wrongIdx(q)));
    check("自信ありでまちがえると、知らせに「思いこみ」と出て、自信は変えられない", (await q.textContent("#msg")).includes("思いこみ") && await q.locator("#dp-sure:disabled").count() === 1);
    await q.click(sel(await ansIdx(q)));
    check("ウソを見抜くと、2段目「どの決まりに当たる？」が3つ出る（押せる所は44px以上）", await q.locator(".why button").count() === 3 && await q.locator(".verdict").count() === 0 && (await q.$$eval(".why button", (b) => b.every((x) => x.getBoundingClientRect().height >= 44))));
    check("2段目の間は、広告の押せる所は押せない", await q.evaluate(() => [...document.querySelectorAll(".pt,#okbtn")].every((b) => b.disabled)));
    await q.reload(); await q.waitForTimeout(150); await q.evaluate(() => __km.play("p"));
    check("2段目の途中で閉じても、2段目から続く", await q.locator(".why button").count() === 3);
    const wr = await q.evaluate(() => Object.keys(__km.G.RULES).find((x) => x !== __km.cur().P.rule));
    await q.click(`.why button[data-r="${wr}"]`);
    check("2段目でまちがえると ✕ ちがう（破線）・もう一度選べる", await q.locator(".why button.ng").count() === 1 && (await q.textContent("#msg")).includes("✕"));
    await why(q); await q.waitForSelector(".verdict");
    const m0 = await q.evaluate(() => __km.load().runs.p.res[0].m);
    check("★は1段目と2段目のまちがいを合わせて数える（1＋1＝2）", m0 === 2, m0);
    check("見抜いた画面に、自信ありでまちがえたことが出る", (await q.textContent(".verdict")).includes("自信ありでまちがえた"));
    await q.click("#next");
    await q.click("#hint"); await q.click("#hint");
    await q.click(sel(await ansIdx(q)));
    check("1段目でヒントを2回使ったら、2段目のヒントは押せない", await q.locator("#hint:disabled").count() === 1);
    await why(q); await q.click("#next");
    await q.click("#okbtn"); await q.waitForSelector(".verdict");
    check("「問題なし」の広告は2段目を出さずに終わる", await q.locator(".why button").count() === 0);
    await q.click("#next"); await q.waitForTimeout(150);
    check("終えた直後の結果に「自信ありの当たり」が出る", (await q.textContent("#surestat")).includes("0/1"));
    const dp = await q.evaluate(() => JSON.parse(localStorage.getItem("kokoku-depth") || "{}"));
    check("まちがえた・ヒントを使った広告は復習に入る（問題なしの広告は入らない）", Object.keys(dp.rv || {}).length === 2, Object.keys(dp.rv || {}).join(","));
    // 次の日：ホームに「復習」が出る・復習は今日の記録に入らない
    await q.evaluate(() => { const d = JSON.parse(localStorage.getItem("kokoku-depth")); for (const k in d.rv) d.rv[k].due = "2026-01-01"; localStorage.setItem("kokoku-depth", JSON.stringify(d)); });
    await q.goto(url); await q.waitForTimeout(150);
    check("日の来た復習があると、ホームに「復習 2枚」", (await q.textContent("#go-r")).includes("復習 2枚"));
    const before = await mem(q);
    await q.click("#go-r");
    check("復習の画面は「復習」と出る", (await q.textContent("header")).includes("復習"));
    for (let i = 0; i < 2; i++) { await solve(q); await q.click("#next"); }
    await q.waitForTimeout(150);
    const after = await mem(q), dp2 = await q.evaluate(() => JSON.parse(localStorage.getItem("kokoku-depth")));
    check("復習を終えると結果は「復習」・今日の記録・連続は増えない", (await q.textContent("h1")).includes("復習") && JSON.stringify(after.days) === JSON.stringify(before.days) && Object.keys(after.runs).every((m) => m !== "r" || after.runs.r === null));
    check("復習で一度で正解すると、次は3日後へ進む", Object.values(dp2.rv).every((x) => x.s === 1 && x.due > TODAY), JSON.stringify(dp2.rv).slice(0, 200));
    await q.goto(url); await q.waitForTimeout(150);
    check("復習を終えたら、ホームの「復習」は消える", await q.locator("#go-r").count() === 0);
    await q.context().close();
  }
  // スマホ幅でもはみ出さない・押す所は44px以上（広告の中の押す所も）
  {
    const bad = [], small = [];
    for (const w of [320, 390]) {
      const q = await newPage(w); await closeHow(q);
      for (const go of [null, "#go-d", "solve", "#go-cal", "#go-dex", "#go-ach", "#go-e", "#f-about"]) {
        if (go === "solve") { await solve(q); }
        else if (go) { await q.goto(url); await q.waitForTimeout(100); await q.click(go); }
        await q.waitForTimeout(100);
        const ov = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (ov > 0) bad.push(`${w}px ${go || "ホーム"} ${ov}px`);
        small.push(...(await q.$$eval("button:not([disabled]), a[href]", (bs) => bs.filter((b) => b.checkVisibility() && !b.closest(".cal")).filter((b) => b.getBoundingClientRect().height < 44).map((b) => (b.id || b.className || b.textContent).slice(0, 20)))).map((x) => `${w}/${go}:${x}`));
      }
      await q.context().close();
    }
    check("幅320pxでも横にはみ出さない", bad.length === 0, bad.join(" / "));
    check("押せる所は高さ44px以上", small.length === 0, [...new Set(small)].slice(0, 8).join(","));
  }
  // 全部の種類・ウソあり/なしの広告を、幅320pxで描いてはみ出さない
  {
    const q = await newPage(320); await closeHow(q);
    const tags = G.KINDS.flatMap((k) => [`${k.id}|w1|o`, `${k.id}|w2|x`, `${k.id}|w3|x`, `${k.id}|w4|x`]);
    await q.evaluate((tags) => __km.save((s) => { s.runs.p = { mode: "p", date: __km.todayKey(), list: tags, res: [], cur: null, id: "w" }; }), tags);
    const bad = [];
    for (let i = 0; i < tags.length; i++) {
      await q.evaluate((i) => { __km.save((s) => { s.runs.p.res = Array.from({ length: i }, () => ({ m: 0 })); s.runs.p.cur = null; }); __km.play("p"); }, i);
      const ov = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 0) bad.push(tags[i]);
    }
    check(`全部の種類の広告（${tags.length}枚）を幅320pxで描いてもはみ出さない`, bad.length === 0, bad.join(","));
    await q.context().close();
  }
  // 見やすさの設定を全部入れても、ページの一番下まで動ける
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 700 } });
    await ctx.addInitScript(() => localStorage.setItem("a11y-v1", JSON.stringify({ read: true, cvd: true, calm: true, say: true, ruby: true })));
    const q = await newPage(390, ctx); await closeHow(q);
    const r = await q.evaluate(() => { window.scrollTo(0, 1e5); const f = document.querySelector("footer").getBoundingClientRect(); return [scrollY, Math.round(f.bottom), innerHeight, getComputedStyle(document.documentElement).position]; });
    check("見やすさの設定を全部入れても、いちばん下まで動ける（html が固定されない）", r[0] > 0 && r[1] <= r[2] && r[3] === "static", r.join(","));
    await ctx.close();
  }
  // キーボードだけで遊べる（Tab と Enter）
  {
    const q = await newPage(); await closeHow(q);
    await q.focus("#go-d"); await q.keyboard.press("Enter"); await q.waitForTimeout(100);
    await q.focus(sel(await ansIdx(q))); await q.keyboard.press("Enter"); await q.waitForTimeout(100);
    if (await q.locator(".why button").count()) { await q.focus(`.why button[data-r="${await q.evaluate(() => __km.cur().P.rule)}"]`); await q.keyboard.press("Enter"); await q.waitForTimeout(100); }
    check("キーボードだけで選んで答えられる（2段目の「どの決まり？」も）", await q.locator(".verdict").count() === 1);
    await q.context().close();
  }
} catch (e) { check("ブラウザでの検査が最後まで動く", false, e.stack.split("\n").slice(0, 3).join(" ")); }

// とことんの並び：何百回作って、1回の中で同じ広告が出ない・難しさの順
try {
  const q = await newPage(); 
  const r = await q.evaluate(() => { let bad = 0, len = 0; for (let i = 0; i < 300; i++) { const l = __km.endlessList(), k = l.map(__km.G.keyOf); len += l.length; if (new Set(k).size !== l.length || l.length !== 46 || __km.G.BY[l[0].split("|")[0]].lv !== 0) bad++; const m = l.concat(__km.moreList(l)); if (new Set(m.map(__km.G.keyOf)).size !== m.length) bad++; } return [bad, len]; });
  check("とことんの並びを300回作って、1回の中で同じ広告が出ない（足した分とも）・はじめはやさしい", r[0] === 0, r.join(","));
  await q.context().close();
} catch (e) { check("とことんの並びの検査が最後まで動く", false, e.message); }

// 深さの部品（shared-workflows template/qa/depth-check.mjs）
{ const e = await checkDepth(readFileSync(path.join(root, "depth.js"), "utf8")); check("depth.js（自信をかける・復習）の動き", e.length === 0, e.join(" / ")); }

// 引き継ぎコード（shared-workflows template/qa/transfer-check.mjs）
try {
  const sample = { "kokoku-v1": JSON.stringify({ v: 1, tut: true, days: { "2026-11-07": { m: [0, 1, 0, 0, 2], k: ["stema", "nijuu", "kigen", "muryo", "konkyo"] } }, hdays: {}, adays: {}, dex: { stema: 1, nijuu: 1, kigen: 1, muryo: 1, konkyo: 1 }, okc: 1, runs: {}, kofi: {}, ach: {}, ebest: 7, t: 1 }) };
  await checkTransfer({ browser, url, game: "kokoku-minuki", sample, check, open: async (pg) => { if (await pg.locator("#howto[open]").count()) await pg.click("#howto-ok"); } });
} catch (e) { check("引き継ぎの検査が最後まで動く", false, e.message.split("\n")[0]); }
await browser.close();
server.close();
check("画面のエラーが無い", errors.length === 0, errors.slice(0, 3).join(" | "));

{ // 見やすさ・読みやすさ・偏り（shared-workflows template/qa/a11y.mjs の写し）
  const { spawnSync } = await import("node:child_process");
  const a = spawnSync(process.execPath, [path.join(root, "qa", "a11y.mjs")], { encoding: "utf8", env: process.env });
  check("見やすさ・読みやすさの検査（qa/a11y.mjs。中身は qa-report/a11y.md）", a.status === 0, (a.stdout.match(/^- ❌.*$/gm) || []).join(" / ") || (a.status ? a.stderr.slice(-300) : ""));
}

const ng = results.filter((r) => !r.ok);
const md = `# 広告みぬき QA\n\n${results.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.name}${r.detail ? `（${r.detail}）` : ""}`).join("\n")}\n\n${ng.length ? `❌ ${ng.length}件` : `✅ ${results.length}項目すべて通過`}\n`;
mkdirSync(path.join(root, "qa-report"), { recursive: true });
writeFileSync(path.join(root, "qa-report/report.md"), md);
console.log(md);
process.exit(ng.length ? 1 : 0);
