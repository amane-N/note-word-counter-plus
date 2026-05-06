# CLAUDE.md - note Word Counter+

## プロジェクト概要
note Word Counter+ は note.com の執筆画面と記事閲覧画面に常時表示されるフローティング文字数カウンター。
- 執筆モード(editor.note.com): 自分の記事を書きながらリアルタイムで文字数・読了時間を確認
- 閲覧モード(note.com/{user}/n/{id}): 他人の記事の文字数・読了時間を確認(読み取り専用)
完全無料配布、note Boosterへの送客装置として位置づけ。

## 開発方針
正規3エージェントハーネス(Planner / Generator / Evaluator with Playwright MCP)で進行。
詳細は development-plan.md を参照。

## 絶対制約
- Manifest V3 必須
- Vanilla JS のみ(フレームワーク禁止)
- 権限は storage, activeTab のみ
- host_permissions は https://note.com/* と https://editor.note.com/* のみ（執筆ページが editor.note.com にリダイレクトされるため両方必須）
- 完全クライアント完結(ネット通信ゼロ)

## サブエージェント運用
- 仕様策定: @planner (休眠、3回連続不合格時に起動)
- 実装+修正: @generator
- 評価: @evaluator (Playwright MCPで動的テスト)

各エージェントは引き渡し宣言で次の担当を指定する。
不合格→修正のループはGenerator自身が担当(Fixerは廃止)。

## ファイル構成
note-word-counter/
├── CLAUDE.md(本ファイル)
├── development-plan.md(開発計画書)
├── manifest.json
├── icons/
├── content/
│   ├── content.js
│   ├── widget.js
│   └── widget.css
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── docs/
│   └── SPRINT_LOG.md(自動生成)
├── auth.json(Playwright認証状態、.gitignoreに追加)
├── test-profile/(Playwrightプロファイル、.gitignoreに追加)
├── .gitignore
└── README.md

## スプリント進捗
(各スプリント完了時に更新)
- [x] S1: 基盤構築
- [x] S2: ウィジェット表示
- [x] S3: DOM監視
- [x] S4: 文字数計算
- [x] S5: 構造カウント
- [x] S6: 目標設定
- [x] S7: 設定画面
- [ ] S8: 送客+ストア提出 (送客✅ / ストア提出🚧 Phase 2 入力中。詳細は docs/release-progress.md)
