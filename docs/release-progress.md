# Chrome Web Store リリース進捗・手順書

note Word Counter+ の Chrome Web Store への提出進捗と、公開までに残された手順をまとめた統合ドキュメント。

最終更新日: 2026-05-06

---

## プロジェクト概要

note.com の執筆画面と記事閲覧画面に常時表示されるフローティング文字数カウンター。

- **執筆モード** (editor.note.com): 自分の記事を書きながらリアルタイムで文字数・読了時間・見出し数・段落数・ハッシュタグ数・画像数を確認
- **閲覧モード** (note.com/{user}/n/{id}): 他人の記事の文字数・読了時間を確認（読み取り専用）
- **目標文字数機能**: 目標を設定するとプログレスバーで達成率を表示
- **完全クライアント完結**: 外部通信ゼロ・ユーザーデータ収集ゼロ

---

## 進捗サマリー

```
[x] Phase 0-1: プライバシーポリシー作成 + GitHub Pages 公開
[x] Phase 0-2: スクリーンショット5枚（1280x800 PNG）
[x] Phase 0-3: アイコン128px 本番版
[x] Phase 1:   ZIPパッケージ作成 + Playwright 実機検証 PASS
[ ] Phase 2:   ダッシュボード入力 ← 次の作業
[ ] Phase 3:   提出 → 審査
[ ] Phase 4:   公開後の周知 + フィードバック対応
```

---

## ✅ 完了した作業の詳細

### Phase 0-1: プライバシーポリシー公開

| 項目 | 値 |
|---|---|
| ローカルファイル | `privacy.html` |
| 公開URL | https://amane-n.github.io/note-word-counter-plus/privacy.html |
| HTTPステータス | 200 OK 確認済み |
| 連絡先メール | amane.n4802@gmail.com |
| 配信方式 | GitHub Pages（main / root） |

宣言内容: 個人情報収集ゼロ、外部通信ゼロ、`storage` と `activeTab` 権限のみ使用、`https://note.com/*` と `https://editor.note.com/*` のみで動作。

### Phase 0-2: スクリーンショット5枚

すべて 1280x800 PNG として `screenshots/` に配置済み:

| # | ファイル | 内容 | サイズ |
|---|---|---|---|
| 01 | `01-editor-mode.png` | 執筆モード・全メトリクス表示（H2見出し12、段落13、3220字） | 214 KB |
| 02 | `02-progress-bar.png` | 目標達成プログレスバー（3,000字目標で107%） | 192 KB |
| 03 | `03-viewer-mode.png` | 閲覧モード（他人記事の文字数確認） | 345 KB |
| 04 | `04-popup-settings.png` | 設定UI全体 + 他ツールへのリンク | 257 KB |
| 05 | `05-customization.png` | ウィジェット左上カスタマイズ | 196 KB |

撮影時の参考本文: `docs/sample-article.md`（3000字超・H2見出し11個）

### Phase 0-3: アイコン本番版

| 項目 | 値 |
|---|---|
| メインカラー | `#41c9b4`（noteティールグリーン） |
| デザイン | 白抜き「字」（漢字）on ティール背景・角丸17.2% |
| ソース | `icons/icon-source.svg` |
| 出力 | `icons/icon16.png`、`icons/icon48.png`、`icons/icon128.png` |

### Phase 1: ZIPパッケージ + 実機検証

| 項目 | 値 |
|---|---|
| 提出ZIP | `note-word-counter-v1.0.0.zip` |
| サイズ | 24 KB |
| エントリ数 | 10ファイル |
| パス区切り | forward-slash で正規化（PowerShell バックスラッシュ問題を回避） |
| ファイル整合性 | SHA256 完全一致 |
| 検証方法 | Playwright で `--load-extension=` ロードして実機テスト |
| 検証結果 | 5項目すべてPASS（拡張機能ロード・閲覧モード・執筆モード・ポップアップ・パス整合性） |

### GitHub リポジトリ

| 項目 | 値 |
|---|---|
| URL | https://github.com/amane-N/note-word-counter-plus |
| 公開状態 | Public |
| コミット | `a67029e` Initial commit, `8ea0547` Email fix |
| GitHub Pages | 有効化済み（main / root） |

---

## 🚧 残りの作業

### Phase 2: Chrome Web Store ダッシュボード入力

詳細プレイブック: [`docs/submission-playbook.md`](./submission-playbook.md)

**所要時間**: 30〜60分

**作業手順の要約**:

1. https://chrome.google.com/webstore/devconsole/ にログイン
2. 「新しいアイテム」→ `note-word-counter-v1.0.0.zip` をアップロード
3. **ストア掲載情報タブ**を入力
   - 商品名・概要(132文字以内)・詳細説明
   - カテゴリ「生産性」、言語「日本語」
   - アイコン128px・スクリーンショット5枚（順序通り）
   - 公式URL: GitHub リポジトリ
   - サポートURL: GitHub Issues
   - 連絡先: amane.n4802@gmail.com
4. **プライバシータブ**を入力
   - 単一用途の説明
   - 各権限（storage / activeTab / host × 2）の正当化
   - リモートコード「使用しない」
   - データ使用「収集なし」+ 3つの誓約チェック
   - プライバシーポリシーURL
   - 審査用テスト手順
5. **配布タブ**を入力
   - 公開設定: 公開 / 地域: すべて / 価格: 無料

各フィールドに貼り付ける**完全コピペ可能なテキスト**は `docs/submission-playbook.md` を参照。

### Phase 3: 提出と審査

1. 右上の「審査用に送信」ボタンをクリック
2. 確認ダイアログでプライバシー宣言にチェック → 送信
3. ステータスが `Pending Review` → `In Review` → `Published` に推移するのを待機

**審査時間目安**:

| ステータス | 所要時間 |
|---|---|
| Pending Review | 数時間〜1日 |
| In Review (人手) | 1〜3日（初回） |
| Published 反映 | 即時〜24時間 |

### Phase 4: 公開後

1. **README に公式ストアURLを追記**
   ```markdown
   Chrome Web Store: https://chromewebstore.google.com/detail/<アイテムID>
   ```
2. **ユーザーフィードバックを GitHub Issues 経由で収集**
3. **既知の改善候補（v1.0.1）**:
   - H2見出し検出ロジックの誤検知修正（目次フィルター `isInToc` の調整）
   - 必要に応じて UI 微調整・新機能追加

---

## 📦 提出資産インベントリ

| 資産 | 用途 | パス / URL |
|---|---|---|
| 提出ZIP | アップロード | `note-word-counter-v1.0.0.zip` |
| プライバシーポリシー | プライバシーポリシーURL欄 | https://amane-n.github.io/note-word-counter-plus/privacy.html |
| アイコン128px | ストアアイコン | `icons/icon128.png` |
| スクリーンショット | スクリーンショット欄 | `screenshots/01〜05-*.png` |
| 概要文(132字以内) | 概要欄 | `STORE_LISTING.md` の「短い説明」 |
| 詳細説明 | 詳細説明欄 | `STORE_LISTING.md` の「詳細説明」 |
| 単一用途+権限正当化 | プライバシータブ | `docs/submission-playbook.md` の §3 |
| サポートメール | 連絡先欄 | amane.n4802@gmail.com |
| 公式URL | 公式URL欄 | https://github.com/amane-N/note-word-counter-plus |
| サポートURL | サポートURL欄 | https://github.com/amane-N/note-word-counter-plus/issues |

---

## 🔗 リファレンスURL

| 用途 | URL |
|---|---|
| Chrome Web Store Dashboard | https://chrome.google.com/webstore/devconsole/ |
| GitHub リポジトリ | https://github.com/amane-N/note-word-counter-plus |
| GitHub Pages サイト | https://amane-n.github.io/note-word-counter-plus/ |
| プライバシーポリシー | https://amane-n.github.io/note-word-counter-plus/privacy.html |
| サポート Issues | https://github.com/amane-N/note-word-counter-plus/issues |
| Chrome Web Store プログラムポリシー | https://developer.chrome.com/docs/webstore/program-policies |

---

## ❌ よくあるリジェクト理由と対処

| リジェクト理由 | 対処 |
|---|---|
| Blue Argon: Permissions | 権限の正当化が不十分。各権限の「なぜ必要か」を具体的に書き直す |
| Purple Potassium: Privacy Policy | プライバシーポリシーURLが死んでないか確認、宣言内容を見直す |
| Spam / Functional issue | スクショと実機能の不一致。スクショを実装に合わせる |
| Single Purpose policy | 詳細説明で機能を盛り込みすぎ。1つの主目的に絞る |
| User Data policy | データ使用の3つの誓約にチェック忘れ |
| Yellow Magnesium: Manifest | manifest.json の不整合。バージョン番号・権限名・ファイルパスを確認 |

リジェクトされても**修正版を無制限に再提出**できます。再審査は通常初回より早い傾向。

---

## 🆙 バージョンアップ手順（今後の更新時）

1. コード修正
2. `manifest.json` の `version` をインクリメント（例: 1.0.0 → 1.0.1。**減らすと拒否される**）
3. 新ZIPを生成（PowerShell 経由、forward-slash必須）:
   ```powershell
   Add-Type -AssemblyName System.IO.Compression
   Add-Type -AssemblyName System.IO.Compression.FileSystem
   $zipPath = Join-Path (Get-Location) 'note-word-counter-vX.Y.Z.zip'
   if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
   $files = @(
     @{Path='manifest.json'; Entry='manifest.json'},
     @{Path='icons\icon16.png'; Entry='icons/icon16.png'},
     @{Path='icons\icon48.png'; Entry='icons/icon48.png'},
     @{Path='icons\icon128.png'; Entry='icons/icon128.png'},
     @{Path='content\content.js'; Entry='content/content.js'},
     @{Path='content\widget.js'; Entry='content/widget.js'},
     @{Path='content\widget.css'; Entry='content/widget.css'},
     @{Path='popup\popup.html'; Entry='popup/popup.html'},
     @{Path='popup\popup.css'; Entry='popup/popup.css'},
     @{Path='popup\popup.js'; Entry='popup/popup.js'}
   )
   $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
   try {
     foreach ($f in $files) {
       $entry = $zip.CreateEntry($f.Entry, [System.IO.Compression.CompressionLevel]::Optimal)
       $stream = $entry.Open()
       try {
         $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $f.Path))
         $stream.Write($bytes, 0, $bytes.Length)
       } finally { $stream.Dispose() }
     }
   } finally { $zip.Dispose() }
   ```
4. ダッシュボードの該当アイテム → 「パッケージ」タブ → 新ZIPをアップロード
5. CHANGELOG / 詳細説明の差分を更新
6. 「審査用に送信」
7. 通常初回より審査が早い（数時間〜1日）

---

## 🧱 プロジェクト構造（提出時点）

```
note-word-counter/
├── CLAUDE.md                          # プロジェクト指示書
├── README.md                          # 利用者向け説明
├── CHANGELOG.md                       # 変更履歴
├── STORE_LISTING.md                   # ストア掲載文の元
├── ICONS_TODO.md                      # アイコン制作メモ
├── manifest.json                      # 拡張機能マニフェスト V3
├── privacy.html                       # プライバシーポリシー(GitHub Pages公開)
├── note-word-counter-v1.0.0.zip       # 提出用パッケージ
├── icons/
│   ├── icon-source.svg                # アイコンソース
│   ├── icon16.png                     # ブラウザUI用
│   ├── icon48.png                     # 拡張管理画面用
│   └── icon128.png                    # ストア掲載用
├── content/
│   ├── content.js                     # DOM監視・計測
│   ├── widget.js                      # ウィジェット生成・更新
│   └── widget.css                     # ウィジェットスタイル
├── popup/
│   ├── popup.html                     # 設定UI
│   ├── popup.css                      # 設定スタイル
│   └── popup.js                       # 設定読み書き
├── screenshots/                       # ストア提出用スクリーンショット
│   ├── 01-editor-mode.png
│   ├── 02-progress-bar.png
│   ├── 03-viewer-mode.png
│   ├── 04-popup-settings.png
│   └── 05-customization.png
└── docs/
    ├── SPRINT_LOG.md                  # スプリント開発ログ(内部)
    ├── sample-article.md              # スクショ撮影用サンプル本文
    ├── submission-playbook.md         # ストア入力プレイブック
    └── release-progress.md            # 本ドキュメント
```

---

## 📅 タイムライン目安

| 段階 | 所要時間 |
|---|---|
| Phase 2 ダッシュボード入力 | 30〜60分 |
| Phase 3 自動審査キュー | 数時間 |
| Phase 3 人手審査 | 1〜3日（初回） |
| 公開反映 | 即時〜24時間 |
| **公開までの合計** | **2〜4日** |

---

## 📜 スプリント進捗（CLAUDE.md と連動）

- [x] S1: 基盤構築
- [x] S2: ウィジェット表示
- [x] S3: DOM監視
- [x] S4: 文字数計算
- [x] S5: 構造カウント
- [x] S6: 目標設定
- [x] S7: 設定画面
- [ ] S8: 送客+ストア提出（送客✅ / ストア提出 Phase 2 進行中）

---

## 🗒️ CHANGELOG

- **2026-05-06**:
  - サポートメール修正（mayele→amane.n4802）。GitHub Pages 再デプロイで反映。
  - アイコン128px 本番版を「字」漢字デザインで作成・差し替え。ZIP再ビルド。
  - スクリーンショット5枚（1280x800）作成完了。
  - GitHub リポジトリ作成・初期コミット・GitHub Pages 公開。
  - プライバシーポリシー HTML 作成・GitHub Pages 公開。
  - 提出用ZIP（forward-slash正規化）作成・Playwright 実機検証 PASS。
  - スプリント S1〜S7 完了とマーク（CLAUDE.md 更新）。
  - 統合進捗ドキュメント `docs/release-progress.md` 作成（本ファイル）。
