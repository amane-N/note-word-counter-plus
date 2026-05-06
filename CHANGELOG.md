# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-05

### Added

#### コア機能
- note.com 記事ページ（閲覧モード）でのフローティングウィジェット表示
- editor.note.com 執筆ページ（執筆モード）でのフローティングウィジェット表示
- 文字数のリアルタイムカウント（スペース・改行を除外した実質文字数）
- 読了時間の自動計算（400字/分を基準）
- 見出し数（H1〜H6）のカウント
- 段落数のカウント
- ハッシュタグ数のカウント
- 画像数のカウント

#### ウィジェット UI
- フローティングウィジェット（折りたたみ／展開切り替え）
- ドラッグによるウィジェット位置の自由移動
- 半透明背景＋backdrop-blur によるモダンなデザイン
- z-index: 999999 による常時最前面表示

#### 目標文字数機能
- ポップアップから目標文字数を設定
- ウィジェット内に達成率プログレスバーを表示
- 達成時のカラー変化（緑色への切り替え）

#### 設定画面（ポップアップ）
- ウィジェット表示位置の選択（右下・左下・右上・左上）
- フォントサイズの選択（小・中・大）
- 表示項目の個別オン／オフ（文字数・読了時間・見出し数・段落数・ハッシュタグ数・画像数）
- 設定の保存・リセット
- 設定変更のリアルタイム反映（ページリロード不要）
- 「他のツール」セクション（Markdown to note、note Booster へのリンク）

#### 技術仕様
- Manifest V3 対応
- Vanilla JS のみ（外部ライブラリ・フレームワーク不使用）
- 権限は `storage`、`activeTab` のみ
- 完全クライアント完結（外部通信ゼロ、プライバシー保護）
- note.com の DOM 変更に備えた複数フォールバックセレクタ

### Security
- 外部サーバーへの通信は一切なし
- ユーザーデータはブラウザのローカルストレージのみに保存
- `innerHTML` を使用しない（XSS リスクゼロ）
- IIFE によるグローバルスコープ汚染の防止

[1.0.0]: https://github.com/your-username/note-word-counter/releases/tag/v1.0.0
