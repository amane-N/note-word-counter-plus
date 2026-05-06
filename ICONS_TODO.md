# アイコン差し替え指示書

Chrome Web Store 提出前に、プレースホルダーアイコンを本番用アイコンに差し替えてください。

## 必要なファイル

| ファイル名 | サイズ | 用途 |
|------------|--------|------|
| `icons/icon16.png` | 16x16 px | ブラウザのファビコン・拡張機能管理画面（小） |
| `icons/icon32.png` | 32x32 px | Windows のタスクバー・高DPI環境 |
| `icons/icon48.png` | 48x48 px | 拡張機能管理画面（中） |
| `icons/icon128.png` | 128x128 px | Chrome Web Store 掲載・インストールダイアログ |

## 配置先

すべて `icons/` フォルダ直下に配置してください。

```
icons/
├── icon16.png
├── icon32.png
├── icon48.png
└── icon128.png
```

## manifest.json での参照

現在の manifest.json は以下のように参照しています。32px を追加する場合は manifest.json も更新してください。

```json
"icons": {
  "16": "icons/icon16.png",
  "32": "icons/icon32.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

manifest.json の `action` セクションにもアイコンを指定する場合:

```json
"action": {
  "default_popup": "popup/popup.html",
  "default_icon": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## デザイン推奨

### カラー
- メインカラー: `#41c9b4`（note 風のティール系グリーン）
- 背景: 白（`#ffffff`）または透明
- テキスト・図形: 白（`#ffffff`）またはメインカラー

### デザイン案

**案A: 文字ベース**
- 背景: ティールグリーン（`#41c9b4`）の角丸正方形
- 中央に白抜きで「N」または「W」の文字

**案B: カウンターアイコン**
- 背景: ティールグリーンの角丸正方形
- 数字「123」または「…」を白抜きで表示し、文字数カウンターを連想させる

**案C: シンプル記号**
- 背景: ティールグリーン
- 白抜きの「#」または「T」（テキストを示す）

### 可読性の注意点
- 16x16 では細かい図形は潰れる。シンプルなシンボルに留める
- 48x48・128x128 ではブランド名や詳細を追加してよい
- Chrome Web Store では 128x128 が店頭の「顔」になる

## 制作ツール例

- [Figma](https://www.figma.com/)（無料プランあり）
- [Inkscape](https://inkscape.org/)（OSS・無料）
- [GIMP](https://www.gimp.org/)（OSS・無料）
- [RealFaviconGenerator](https://realfavicongenerator.net/)（PNG からの多サイズ書き出し）

## 差し替え後の確認手順

1. `chrome://extensions/` を開いてリロードボタンをクリック
2. 拡張機能管理ページでアイコンが更新されていることを目視確認
3. ツールバーのアイコンが更新されていることを確認
4. Chrome Web Store デベロッパーダッシュボードにアップロードし、プレビューで確認
