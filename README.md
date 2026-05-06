# note Word Counter+

note.com の執筆画面・記事閲覧画面に常時表示されるフローティング文字数カウンター Chrome 拡張機能です。
完全無料・完全クライアント完結（外部通信ゼロ）で動作します。

## 機能一覧

### 執筆モード（editor.note.com）
- 執筆中の文字数をリアルタイム表示
- 読了時間の自動計算（400字/分基準）
- 見出し数・段落数・ハッシュタグ数・画像数の表示
- 目標文字数の設定と進捗バー表示
- ウィジェットの折りたたみ／展開切り替え

### 閲覧モード（note.com）
- 記事ページの文字数・読了時間を表示（読み取り専用）

### 共通設定
- ウィジェット表示位置の選択（右下・左下・右上・左上）
- フォントサイズの選択（小・中・大）
- 表示項目の個別オン／オフ（文字数・読了時間・見出し数・段落数・ハッシュタグ数・画像数）
- 設定はブラウザのローカルストレージに保存（クラウド同期なし）

## インストール手順（開発版）

Chrome Web Store への公開前に手動でインストールする方法です。

1. このリポジトリを ZIP でダウンロードするか `git clone` する
2. Chrome を開き、アドレスバーに `chrome://extensions/` と入力してアクセス
3. 右上の「デベロッパーモード」トグルを **ON** にする
4. 「パッケージ化されていない拡張機能を読み込む」ボタンをクリック
5. ダウンロード・クローンしたフォルダ（`cc-note Word Counter-company`）を選択して「フォルダーの選択」
6. 拡張機能一覧に「note Word Counter+」が表示されれば読み込み成功

### 動作確認

1. `https://note.com/` の記事ページにアクセスする
2. 画面右下にフローティングウィジェットが表示されることを確認する
3. `https://editor.note.com/` で新規記事を開き、文字を入力すると文字数がリアルタイムで変わることを確認する

## 技術仕様

| 項目 | 内容 |
|------|------|
| Manifest | V3 |
| 言語 | Vanilla JS（フレームワーク不使用） |
| 権限 | `storage`, `activeTab` |
| host_permissions | `https://note.com/*`, `https://editor.note.com/*` |
| 外部通信 | なし（完全クライアント完結） |
| 対応ブラウザ | Google Chrome 最新版 |

## ファイル構成

```
cc-note Word Counter-company/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── content/
│   ├── content.js      # コンテンツスクリプト（DOM監視・計測）
│   ├── widget.js       # ウィジェット生成・更新・設定適用
│   └── widget.css      # ウィジェットスタイル
├── popup/
│   ├── popup.html      # 設定ポップアップ画面
│   ├── popup.css       # ポップアップスタイル
│   └── popup.js        # 設定の読み書きロジック
├── docs/
│   └── SPRINT_LOG.md   # 開発ログ
├── CHANGELOG.md
├── ICONS_TODO.md
├── STORE_LISTING.md
└── README.md
```

## ライセンス

MIT License

Copyright (c) 2026 note Word Counter+ Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
