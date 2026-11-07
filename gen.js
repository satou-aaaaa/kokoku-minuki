// 広告みぬきの問題を作る（ブラウザと node の両方で使う）。
// 1枚の広告（または SNS の投稿）を、決まり（KINDS）と種から作る。会社・商品・人はすべて架空。
// 広告の押せる所（parts）のうち、ウソ・言いすぎの所が1つ（ans）。問題の無い広告は ans = -1（「問題なし」が正解）。
// 中身は消費者庁の資料で確かめた決まり（README・「このゲームについて」に出典）。乱数 R は呼ぶ回数が毎回同じになるように使う。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  // 決まりの大きな分け方（景品表示法）。名前はやさしい言葉で、法律の言葉は小さく添える
  const RULES = {
    yu: { name: "品質のウソ", law: "優良誤認（景品表示法5条1号）" },
    ri: { name: "値段・条件のウソ", law: "有利誤認（景品表示法5条2号）" },
    st: { name: "かくれた広告", law: "ステルスマーケティング（景品表示法5条3号の告示）" },
  };
  // 出典（消費者庁）。画面の「このゲームについて」と README にも同じものを書く
  const SRC = {
    gai: ["表示規制の概要", "https://www.caa.go.jp/policies/policy/representation/fair_labeling/representation_regulation"],
    no1: ["No.1表示に関する実態調査報告書（2024年）", "https://www.caa.go.jp/policies/policy/representation/fair_labeling/survey/assets/representation_cms216_240926_02.pdf"],
    price: ["不当な価格表示についての景品表示法上の考え方", "https://www.caa.go.jp/policies/policy/representation/fair_labeling/guideline/pdf/100121premiums_35.pdf"],
    uchi: ["打消し表示に関する実態調査報告書（2017年）", "https://www.caa.go.jp/policies/policy/representation/fair_labeling/pdf/fair_labeling_170907_0003.pdf"],
    stema: ["ステルスマーケティングの運用基準（2023年）", "https://www.caa.go.jp/notice/assets/representation_cms216_230328_03.pdf"],
    fuji: ["不実証広告規制に関する指針", "https://www.caa.go.jp/policies/policy/representation/fair_labeling/guideline/pdf/100121premiums_34.pdf"],
    kukan: ["空間除菌をうたう商品への措置命令（2021年）", "https://www.caa.go.jp/notice/assets/representation_211217_01.pdf"],
    kigen: ["期限を区切った還元の表示への措置命令（2025年）", "https://www.caa.go.jp/notice/assets/representation_cms210_250327_01.pdf"],
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
  const yen = (n) => n.toLocaleString("en-US") + "円";

  // 架空のお店（実在の会社名をまねない。ひらがなの屋号）。色は帯の色
  const SHOPS = [
    ["そよかぜ堂", "#2f6f8f"], ["こもれび生活", "#4b6b2f"], ["なぎさ商会", "#245b8c"], ["つむぎ屋", "#8a4b2a"],
    ["ひなた通販", "#9a5a00"], ["かざみ電機", "#3b4f8a"], ["しずく化粧品", "#7a3f6e"], ["ゆうなぎ食品", "#7a4a1e"],
  ];
  // 商品：名前・絵・種類（どの決まりで使うか）・使い方の言葉
  const P = {
    cream: ["保湿クリーム", "🧴", "skin"], lotion: ["化粧水", "💧", "skin"], sun: ["日焼け止め", "☀️", "skin"], shampoo: ["シャンプー", "🫧", "skin"],
    aojiru: ["青汁", "🥬", "food2"], vita: ["ビタミンのサプリ", "💊", "food2"], kurozu: ["黒酢ドリンク", "🍶", "food2"], tea: ["健康茶", "🍵", "food2"],
    souji: ["コードレス掃除機", "🧹", "home"], futon: ["羽毛ぶとん", "🛏️", "home"], senzai: ["洗たく洗剤", "🧼", "home"], nabe: ["フライパン", "🍳", "home"], kaden: ["電気ケトル", "🫖", "home"],
    air: ["空気清浄機", "🌀", "air"], spray: ["除菌スプレー", "🧴", "air"], oku: ["置くタイプの除菌剤", "🫙", "air"],
    beef: ["牛肉", "🥩", "meat", "牛"], pork: ["豚肉", "🥓", "meat", "豚"], unagi: ["うなぎのかば焼き", "🐟", "meat", "うなぎ"], hachi: ["はちみつ", "🍯", "meat", "はちみつ"], kome: ["お米", "🍚", "meat", "米"], soba: ["そば", "🍜", "meat", "そば粉"],
    eikaiwa: ["オンライン英会話", "🗣️", "svc"], juku: ["学習塾", "📚", "svc"], gym: ["スポーツジム", "🏋️", "svc"], hikari: ["光回線", "📶", "svc"],
    neck: ["ネックウォーマー", "🧣", "gadget"], insole: ["中じき", "👟", "gadget"], pillow: ["まくら", "💤", "gadget"], band: ["腕につけるバンド", "⌚", "gadget"],
  };
  const of = (cat) => Object.keys(P).filter((k) => P[k][2] === cat);
  const SKIN = of("skin"), FOOD2 = of("food2"), HOME = of("home"), AIR = of("air"), MEAT = of("meat"), SVC = of("svc"), GADGET = of("gadget");
  const GOODS = [...SKIN, ...FOOD2, ...HOME, ...GADGET];
  const PREF = ["北海道", "岩手県", "新潟県", "長野県", "静岡県", "鹿児島県", "宮崎県", "熊本県"];
  const PRICE = [1980, 2980, 3980, 4980, 5980, 7980, 9800, 12800, 19800, 29800];
  const cut = (p, R) => { const r = [0.5, 0.6, 0.7][ri(R, 0, 2)]; return Math.max(980, Math.round((p * r) / 100) * 100 - 20); };
  const YEAR = [2025, 2026];
  const HANDLES = ["mio_kurashi", "hiro_daily", "sora.note", "kei_cafe", "yuu_room", "nana_life", "taku_tools", "rin_mama_papa"];
  const TAGS = ["#毎日", "#暮らし", "#おすすめ", "#買ってよかった", "#日常", "#ていねいな暮らし", "#お気に入り", "#シンプルライフ"];

  // 広告の部品を作る。t は押せる所の種類（見た目）：img 商品 / head 大きな字 / sub 小見出し / price 値段 / note ※の小さな字 / cta ボタン / user・body・tags（SNS）
  const part = (t, text, extra) => Object.assign({ t, text }, extra || {});
  const shopAd = (R, prod, parts, extra) => { const s = pick(R, SHOPS); return Object.assign({ layout: "shop", shop: s[0], color: s[1], emoji: P[prod][1], prod: P[prod][0], pid: prod, parts }, extra || {}); };

  // 種類：id・難しさ・決まりの分け方・帳の名前・ヒント（見るところ）・出典・作り方（ok=true なら問題の無い広告）
  const KINDS = [
    // ---- やさしい ----
    { id: "no1img", lv: 0, rule: "yu", name: "印象だけの「満足度No.1」", src: "no1",
      look: "「No.1」は、だれに聞いて何と比べたかが大事。※を読みましょう。",
      make(R, ok) {
        const prod = pick(R, [...GOODS, ...SVC]), y = pick(R, YEAR), n = pick(R, [300, 500, 1000, 1200]), k = ri(R, 5, 12), nm = P[prod][0];
        const head = part("head", `${nm} 満足度 No.1`);
        const note = part("note", ok ? `※${y}年 調査会社が、${nm}を半年以上使った人から無作為に${n}人を選び、主な${k}社の商品と比べて聞いた結果` : `※${y}年 ネット調査。${nm}を使ったことのない${n}人に、サイトを見た印象を聞いた結果`);
        return { ...shopAd(R, prod, [part("img", nm), head, part("sub", pick(R, ["選ばれています", "毎日の暮らしに", "続けやすさで選ぶなら"])), note]), ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "使った人を無作為に選び、主な商品と比べた調査です。「満足度」の表示と合っています。" : "使っていない人の「印象」だけでは、使った人の満足度は分かりません。※で断っても問題は消えません。",
          fix: "実際に使った人に、主な商品と比べて聞いた調査なら言えます。" };
      } },
    { id: "nijuu", lv: 0, rule: "ri", name: "売っていない「通常価格」", src: "price",
      look: "比べている「通常価格」で、本当に売っていたか。わかったことを見ましょう。",
      make(R, ok) {
        const prod = pick(R, [...GOODS, ...HOME]), p1 = pick(R, PRICE), p2 = cut(p1, R), w = ri(R, 6, 12), nm = P[prod][0];
        return { ...shopAd(R, prod, [part("img", nm), part("head", pick(R, ["決算セール", "週末セール", "在庫一掃セール", "感謝セール"])), part("price", `通常価格 ${yen(p1)} → ${yen(p2)}`), part("cta", "カートに入れる")]),
          memo: ok ? `売り値の記録：セール前の8週間のうち${ri(R, 6, 8)}週間、${yen(p1)}で売っていた。` : `売り値の記録：${yen(p1)}で売ったのは発売日の1日だけ。そのあと${w}週間ずっと${yen(p2)}。`,
          ans: ok ? -1 : 2, v: ok ? "o" : "x",
          why: ok ? "セール前の8週間の半分より長く、その値段で売っていました。比べる値段として使えます。" : "ほとんど売っていない値段を「通常価格」にして、大きく値引きしたように見せています。",
          fix: "セール前の8週間のうち半分より長く、その値段で売っていれば比べられます。" };
      } },
    { id: "kanso", lv: 0, rule: "yu", name: "「個人の感想です」の体験談", src: "uchi",
      look: "「個人の感想です」と書けば、何を言ってもよいのでしょうか。",
      make(R, ok) {
        const skin = R() < 0.5, prod = pick(R, skin ? SKIN : FOOD2), nm = P[prod][0], age = pick(R, ["30代", "40代", "50代", "60代"]), job = pick(R, ["会社員", "パート", "自営業", "公務員"]);
        const bad = skin ? [`塗るだけで シミが消えた！`, `1本で 10歳若い肌に！`][ri(R, 0, 1)] : [`飲むだけで 1か月 −${ri(R, 5, 9)}kg！`, `飲むだけで 血圧が下がった！`][ri(R, 0, 1)];
        const good = skin ? pick(R, ["のびがよく、べたつきません", "香りがやさしく、毎日使えます"]) : pick(R, ["すっきり飲みやすい味", "毎朝の1杯に"]);
        return { ...shopAd(R, prod, [part("img", nm), part("head", ok ? good : bad), part("sub", `「続けています」${age}・${job}`), part("note", "※個人の感想です。効果には個人差があります。")]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "効きめを言わず、使い心地・味の感想だけです。言いすぎはありません。" : "だれでも同じ効きめがあるように見せています。「個人の感想です」と書いても、問題は消えません。",
          fix: "効きめを言うなら、確かな試験の結果と、効いた人・効かなかった人の割合をはっきり書きます。" };
      } },
    { id: "stema", lv: 0, rule: "st", name: "広告とわからない投稿", src: "stema",
      look: "わかったことを読んで、だれが頼んだ投稿かを確かめましょう。",
      make(R, ok) {
        const prod = pick(R, [...SKIN, ...FOOD2, ...HOME, ...GADGET]), nm = P[prod][0], s = pick(R, SHOPS), h = pick(R, HANDLES), buried = !ok && R() < 0.5;
        const praise = pick(R, ["本当に買ってよかった", "もう手放せない", "家族みんなで使ってます", "リピート決定"]);
        const t = [TAGS[ri(R, 0, 7)], TAGS[ri(R, 0, 7)]].filter((x, i, a) => a.indexOf(x) === i);
        const tags = ok ? `#PR ${s[0]}さんから商品をいただきました` : buried ? `#${nm} ${TAGS.join(" ")} #pr` : `#${nm} ${t.join(" ")}`;
        return { layout: "sns", shop: s[0], color: s[1], emoji: P[prod][1], prod: nm, pid: prod, handle: h,
          parts: [part("user", `@${h}・${ri(R, 1, 9)}時間前`), part("body", `最近ずっと使っている${nm}。${praise}！`), part("img", nm), part("tags", tags)],
          memo: `この投稿は、${s[0]}が頼んで、お礼（商品と${yen(pick(R, [3000, 5000, 10000, 30000]))}）を渡したもの。`,
          ans: ok ? -1 : buried ? 3 : 1, v: ok ? "o" : buried ? "b" : "x",
          why: ok ? "会社に頼まれた投稿だと、はじめの「#PR」と文で分かります。" : buried ? "「#pr」はありますが、たくさんのハッシュタグの最後にうもれていて、広告だと分かりにくくなっています。" : "会社に頼まれ、お礼をもらった投稿なのに、自分の感想のように見せています。",
          fix: "「広告」「PR」や「○○から商品の提供を受けて投稿」と、目立つ所にはっきり書きます。" };
      } },
    // ---- ふつう ----
    { id: "kigen", lv: 1, rule: "ri", name: "いつまでも続く「今日まで」", src: "kigen",
      look: "「今日まで」のあと、条件は本当に変わるでしょうか。",
      make(R, ok) {
        const prod = pick(R, [...GOODS, ...SVC]), nm = P[prod][0], p1 = pick(R, PRICE), p2 = cut(p1, R), pt = ri(R, 5, 20);
        const pts = R() < 0.5;
        return { ...shopAd(R, prod, [part("img", nm), part("head", pts ? `今日まで！ ポイント${pt}倍` : `本日かぎり ${yen(p2)}`), part("sub", pick(R, ["お急ぎください", "この機会に", "お見のがしなく"])), part("cta", "今すぐ申し込む")]),
          memo: ok ? (pts ? `明日からはポイント1倍にもどる。お知らせどおり。` : `明日からは${yen(p1)}にもどる。お知らせどおり。`) : (pts ? `先月から毎日「今日まで」と出し、毎日ポイント${pt}倍。` : `先月から毎日「本日かぎり」と出し、毎日${yen(p2)}。`),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "書いてあるとおり、明日から条件が変わります。" : "いつでも同じ条件なのに「今日まで」と書いて、急いで買わせようとしています。",
          fix: "本当に終わる日を書き、その日のあとは条件を変えます。" };
      } },
    { id: "kukan", lv: 1, rule: "yu", name: "小さな箱での試験", src: "kukan",
      look: "試験をした場所と、広告の言う場所は同じでしょうか。※を読みましょう。",
      make(R, ok) {
        const prod = pick(R, AIR), nm = P[prod][0], pc = pick(R, [99, 99.9, 98]), hr = pick(R, [1, 4, 24]), m3 = pick(R, [1, 0.03, 0.025]);
        return { ...shopAd(R, prod, [part("img", nm), part("head", ok ? `${m3}㎥の箱の中で ${hr}時間で菌${pc}%減` : `${prod === "spray" ? "ひと吹きで" : "置くだけで"} お部屋の菌 ${pc}%除去`), part("sub", pick(R, ["リビングにも寝室にも", "家族の毎日に"])), part("note", ok ? `※第三者の試験機関の結果。お部屋全体での効きめを示すものではありません。` : `※${m3}㎥の閉じた箱の中で、${hr}時間置いた試験の結果です。`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "大きな字のほうに、試験をした箱の大きさが書いてあります。言っていることと試験が合っています。" : "閉じた小さな箱の試験で、お部屋全体で効くように見せています。※で断っても、問題は消えません。",
          fix: "試験と同じ条件（箱の大きさ・時間）で言うか、実際の部屋で確かめた結果を出します。" };
      } },
    { id: "genryo", lv: 1, rule: "yu", name: "一部だけの「100%」", src: "gai",
      look: "大きな字の「100%」と、※の中身を比べましょう。",
      make(R, ok) {
        const prod = pick(R, MEAT), nm = P[prod][0], what = P[prod][3], pref = pick(R, PREF), pc = ri(R, 10, 40);
        return { ...shopAd(R, prod, [part("img", nm), part("head", `国産${what} 100%`), part("price", `${yen(pick(R, [980, 1280, 1980, 2980, 3980]))}（税込）`), part("note", ok ? `※${pref}産の${what}だけを使っています。` : `※国産${what}は${pc}%。のこりは外国産です。`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "国産だけを使っていて、「100%」のとおりです。" : "国産は一部だけなのに、全部が国産のように見せています。",
          fix: "「国産○○を一部使用」など、実際の割合が分かるように書きます。" };
      } },
    { id: "muryo", lv: 1, rule: "ri", name: "条件つきの「0円」", src: "uchi",
      look: "大きな「0円」と、小さな※の条件を比べましょう。",
      make(R, ok) {
        const prod = pick(R, [...SKIN, ...FOOD2]), nm = P[prod][0], p = pick(R, [3980, 4980, 5980, 6980, 7980]), n = ri(R, 3, 6);
        return { ...shopAd(R, prod, [part("img", nm), part("head", ok ? `初回0円・2回目から${yen(p)}（${n}回のお約束）` : "初回 0円！"), part("cta", "今すぐ申し込む"), part("note", ok ? `※${n}回のあとは、いつでもやめられます。` : `※${n}回以上の定期購入が条件。2回目から毎回${yen(p)}。`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "大きな字のすぐそばに、2回目からの値段と回数が書いてあります。" : `「0円」と大きく書き、${n}回分で合わせて${yen(p * (n - 1))}かかる条件を小さな字に回しています。`,
          fix: "「初回0円」と同じ大きさで、2回目からの値段と回数のお約束を書きます。" };
      } },
    { id: "saiyasu", lv: 1, rule: "ri", name: "古くてせまい「最安値」", src: "gai",
      look: "いつ、どのお店と比べたのか。※を読みましょう。",
      make(R, ok) {
        const prod = pick(R, [...HOME, ...MEAT]), nm = P[prod][0], y = pick(R, [2018, 2019, 2020]), n = ri(R, 8, 30);
        return { ...shopAd(R, prod, [part("img", nm), part("head", "地域で一番の安さ"), part("price", `${yen(pick(R, PRICE))}（税込）`), part("note", ok ? `※毎週月曜に、市内で同じ品を売る全${n}店の値段を調べ、比べています。` : `※${y}年に、近くの2店と比べた結果です。`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "市内の全部のお店と、毎週比べ直しています。「地域で一番」のとおりです。" : `${y}年に2店と比べただけでは、いまの地域で一番安いとは言えません。`,
          fix: "比べた時期・範囲を新しく広くし、いつ・どこと比べたかを書きます。" };
      } },
    // ---- むずかしい ----
    { id: "uriage", lv: 2, rule: "yu", name: "都合のよい期間の「売上No.1」", src: "no1",
      look: "何と比べて、どのくらいの期間で一番だったのか。※を読みましょう。",
      make(R, ok) {
        const prod = pick(R, GOODS), nm = P[prod][0], y = pick(R, YEAR), m = ri(R, 1, 12), d = ri(R, 1, 28), h = ri(R, 9, 20);
        return { ...shopAd(R, prod, [part("img", nm), part("head", "売上 No.1"), part("sub", pick(R, ["人気の理由をお確かめください", "みんなが選んだ"])), part("note", ok ? `※${y}年1〜12月 全国の${nm}の販売数（調査会社の集計）` : `※${y}年${m}月${d}日 ${h}時〜${h + 1}時、当店ネットショップの${nm}の中で`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "1年間・全国の同じ種類の商品と比べた集計です。" : "自分の店の中の、たった1時間だけの売れ行きです。ふつうの人が思う「No.1」と合いません。",
          fix: "主な同じ種類の商品と、じゅうぶんな期間で比べた結果だけを使います。" };
      } },
    { id: "ishi", lv: 2, rule: "yu", name: "身内に聞いた「医師のおすすめ」", src: "no1",
      look: "だれに聞いた結果なのか。※を読みましょう。",
      make(R, ok) {
        const prod = pick(R, [...SKIN, ...GADGET, ...FOOD2]), nm = P[prod][0], pc = pick(R, [80, 85, 90, 92]), n = pick(R, [300, 500, 800]), y = pick(R, YEAR);
        return { ...shopAd(R, prod, [part("img", nm), part("head", `医師の${pc}%が すすめたい`), part("sub", pick(R, ["毎日のケアに", "安心して使いたい方へ"])), part("note", ok ? `※${y}年 調査会社が、医師の名簿から無作為に選んだ${n}人に聞いた結果` : `※当社と仕事をしている医師${pick(R, [5, 8, 10])}人に聞いた結果`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "医師の中から無作為に選んだ人に聞いています。数も十分です。" : "会社と仕事をしている、少ない医師に聞いただけです。医師の多くがすすめているように見せています。",
          fix: "かたよりのない選び方で、じゅうぶんな人数に聞いた結果を使います。" };
      } },
    { id: "tokkyo", lv: 2, rule: "yu", name: "効きめと関係ない「特許」", src: "gai",
      look: "特許は、何についてのものでしょうか。※を読みましょう。",
      make(R, ok) {
        const prod = pick(R, [...SKIN, ...FOOD2]), nm = P[prod][0], eff = pick(R, ["うるおい", "ハリ", "すっきり"]), what = pick(R, ["容器のふたの形", "箱の開け方", "ポンプのしくみ"]);
        return { ...shopAd(R, prod, [part("img", nm), part("head", ok ? `${what}で特許を取りました` : `特許取得の ${eff}パワー`), part("price", `${yen(pick(R, PRICE))}（税込）`), part("note", `※特許は、${what}についてのものです。`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "特許が何についてのものか、大きな字でそのまま書いています。" : `特許は${what}のことなのに、中身の効きめに特許があるように見せています。`,
          fix: "特許が何についてのものかを、そのまま書きます。" };
      } },
    { id: "konkyo", lv: 2, rule: "yu", name: "根拠の足りない効きめ", src: "fuji",
      look: "その効きめは、どんな試験で確かめたのでしょうか。※を読みましょう。",
      make(R, ok) {
        const prod = pick(R, GADGET), nm = P[prod][0];
        const claim = { neck: "巻くだけで 肩こりが消える", insole: "はくだけで ひざの痛みが消える", pillow: "使うだけで いびきが止まる", band: "つけるだけで 体のゆがみが直る" }[prod];
        const fine = { neck: "首まわりを やさしく温める", insole: "やわらかく 足をつつむ", pillow: "高さを 3段に変えられる", band: "歩いた歩数を 記録する" }[prod];
        const fact = { neck: "※表面の温度は約40℃（当社で測定）", insole: "※厚さ8mmのやわらかい素材", pillow: "※中の板を出し入れして高さを変えます", band: "※歩数は手をふる動きから数えます" }[prod];
        return { ...shopAd(R, prod, [part("img", nm), part("head", ok ? fine : claim), part("price", `${yen(pick(R, PRICE))}（税込）`), part("note", ok ? fact : `※社員${ri(R, 3, 5)}人が使ってみた感想です。`)]),
          ans: ok ? -1 : 1, v: ok ? "o" : "x",
          why: ok ? "商品のしくみ・測った値だけを言っていて、効きめを言いすぎていません。" : "数人の社員の感想では、効きめの確かな根拠になりません。効きめを言うには、確かな試験の結果が要ります。",
          fix: "効きめを言うなら、表示と同じ内容を確かめた試験の結果を持っておきます。" };
      } },
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1枚を作る。tag は「種類|種|o か x」（o は問題なし・x はウソあり・無ければ種で決める）。同じ tag ならいつも同じ広告
  function make(tag) {
    const [kind, seed, want] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const R = rng(seedOf(kind + "|" + seed)), roll = R(), ok = want === "o" ? true : want === "x" ? false : roll < 0.3;
    const p = k.make(R, ok);
    const key = [kind, p.v, p.pid, p.shop, p.parts.map((x) => x.text).join("/"), p.memo || ""].join("|");
    return { tag, kind, lv: k.lv, rule: k.rule, name: k.name, look: k.look, src: k.src, ok, key, ...p };
  }
  // 同じ広告かを見分ける短い名前（とことん・練習で、1回の中に同じものを出さないため）
  const keyOf = (tag) => { const p = make(tag); return p ? p.key : ""; };

  // 今日の5枚（やさしい2・ふつう2・むずかしい1）。種類は重ねず、問題なしは1〜2枚
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), sh = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const ids = [...sh(kindsOf(0)).slice(0, 2), ...sh(kindsOf(1)).slice(0, 2), ...sh(kindsOf(2)).slice(0, 1)];
    const nOk = R() < 0.5 ? 1 : 2, okAt = sh([0, 1, 2, 3, 4]).slice(0, nOk);
    return ids.map((id, i) => `${id}|${date}:d${i}|${okAt.includes(i) ? "o" : "x"}`);
  }
  // 上級の3枚（ふつう・むずかしいから、今日の5枚と別の種類。ヒントなし）。問題なしは0〜1枚
  function hardTags(date) {
    const used = dailyTags(date).map((t) => t.split("|")[0]), R = rng(seedOf("hard:" + date));
    const pool = [...kindsOf(1), ...kindsOf(2)].filter((x) => !used.includes(x));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const okAt = R() < 0.5 ? ri(R, 0, 2) : -1;
    return pool.slice(0, 3).map((id, i) => `${id}|${date}:h${i}|${i === okAt ? "o" : "x"}`);
  }

  const KOKOKU = { KINDS, BY, LV, RULES, SRC, SHOPS, P, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags };
  if (typeof module !== "undefined" && module.exports) module.exports = KOKOKU; else root.KOKOKU = KOKOKU;
})(typeof self !== "undefined" ? self : this);
