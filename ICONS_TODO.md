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

### カラー（v1.0.0 採用）
- メインカラー: `#7C3AED`（鮮やかな紫 / モダン）
- 前景: 白（`#FFFFFF`）
- 角丸: 17.2%（128px なら 22px）

### 採用デザイン

幾何学的な「N」: 2本の白い縦バー（左右）と、対角線を平行四辺形で表現したストローク。`icons/icon-source.svg` がソース。

ジオメトリ（128x128 基準）:
- 余白: 24px
- バー幅: 22px
- 左バー: x=24..46, y=24..104
- 右バー: x=82..104, y=24..104
- 対角線: ポリゴン (46,24)-(68,24)-(82,104)-(60,104)

### 旧案（参考）
- ティール `#41c9b4` + 白抜き「字」漢字（v1.0.0 で却下）

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
