# 広告みぬき

広告の「No.1」「通常価格 → 半額」「個人の感想です」「今日まで」。架空の広告・SNS の投稿を1枚ずつ調べ、ウソ・言いすぎの所を見抜く1日5枚の学習ゲームです。事前の知識なしで遊べ、景品表示法のきほん（品質のウソ・値段や条件のウソ・かくれた広告）が身につきます。

- 遊ぶ：<https://satou-aaaaa.github.io/kokoku-minuki/>
- 今日の5枚はだれでも同じ（1日1回）。上級・とことん・練習は好きなだけ。時間制限なし。
- 記録は遊ぶ人のブラウザだけに残ります（外へ送りません）。別の端末へは「引き継ぎ」で移せます。

## 中身の出どころ（消費者庁）

- 表示規制の概要（優良誤認・有利誤認）：<https://www.caa.go.jp/policies/policy/representation/fair_labeling/representation_regulation>
- No.1表示に関する実態調査報告書（2024年）：<https://www.caa.go.jp/policies/policy/representation/fair_labeling/survey/assets/representation_cms216_240926_02.pdf>
- 不当な価格表示についての景品表示法上の考え方（二重価格）：<https://www.caa.go.jp/policies/policy/representation/fair_labeling/guideline/pdf/100121premiums_35.pdf>
- 打消し表示に関する実態調査報告書（2017年）：<https://www.caa.go.jp/policies/policy/representation/fair_labeling/pdf/fair_labeling_170907_0003.pdf>
- ステルスマーケティングの運用基準（2023年）：<https://www.caa.go.jp/notice/assets/representation_cms216_230328_03.pdf>
- 不実証広告規制に関する指針：<https://www.caa.go.jp/policies/policy/representation/fair_labeling/guideline/pdf/100121premiums_34.pdf>
- 空間除菌をうたう商品への措置命令（2021年）：<https://www.caa.go.jp/notice/assets/representation_211217_01.pdf>
- 期限を区切った還元の表示への措置命令（2025年）：<https://www.caa.go.jp/notice/assets/representation_cms210_250327_01.pdf>

出てくる会社・商品・人・数字はすべて架空です。問題は資料の考え方を短くまとめたもので、法律の相談ではありません。買い物で困ったときは、消費者ホットライン「188」へ。

## 開発

```bash
bash scripts/setup.sh
node qa/run.mjs
```

決まりは [AGENTS.md](AGENTS.md)。感想は [感想フォーム](https://github.com/satou-aaaaa/kokoku-minuki/issues/new?template=feedback.yml) から。
