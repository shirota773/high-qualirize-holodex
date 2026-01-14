# 🎬 Holodex Video Quality Enhancer

Holodexで複数のYouTube動画を高画質で視聴できるようにするChrome拡張機能です。

## 📋 概要

[Holodex](https://holodex.net)は、VTuberのライブストリームを複数並べて同時視聴できる素晴らしいサービスです。しかし、YouTube IFrame APIの制限により、動画の画質が360pに制限されることがあります。

この拡張機能は、以下の方法で画質を向上させます:

1. **プレイヤーサイズの操作** - YouTubeは動画プレイヤーのサイズに基づいて画質を決定します(725px以下で360p)。この拡張機能はプレイヤーに最適なサイズを設定します。
2. **画質パラメータの注入** - プレイヤー初期化時に高画質リクエストパラメータを追加します。
3. **YouTubeプレイヤーAPIの活用** - 可能な限りYouTube Player APIを使用して画質を制御します。

## 🔍 技術的背景

### なぜ360pに制限されるのか?

YouTube IFrame APIの調査により、以下の理由が判明しました:

1. **YouTube APIの変更** - YouTubeは外部からの画質制御API(`setPlaybackQuality`, `getPlaybackQuality`, `getAvailableQualityLevels`)を無効化しました。
2. **プレイヤーサイズによる自動選択** - YouTubeは埋め込みプレイヤーのサイズとネットワーク速度に基づいて画質を自動的に選択します。
3. **Holodexの実装** - Holodexは複数動画を並べて表示するため、個々のプレイヤーサイズが小さくなり、結果として360pが選択されます。

### この拡張機能の仕組み

1. **Content Script (`content.js`)**:
   - Holodexページにスクリプトを注入
   - YouTube iframeを検出し、URLパラメータを修正
   - プレイヤーの最小サイズを設定するCSSを注入

2. **Injected Script (`injected.js`)**:
   - ページコンテキストで実行され、YouTube Player APIに直接アクセス
   - `YT.Player`コンストラクタをラップし、プレイヤーオプションを修正
   - 複数の方法で画質設定を試行

3. **Popup UI (`popup.html`, `popup.js`)**:
   - ユーザーが画質を選択できるインターフェース
   - 拡張機能の有効/無効切り替え
   - 設定の保存と適用

## 🚀 インストール方法

### Chrome Web Storeからのインストール(予定)

現在、この拡張機能はまだChrome Web Storeで公開されていません。以下の手動インストール方法をご利用ください。

### 手動インストール(開発者モード)

1. **このリポジトリをダウンロード**:
   ```bash
   git clone https://github.com/shirota773/high-qualirize-holodex.git
   cd high-qualirize-holodex
   ```

2. **アイコンを生成**(オプション - 既に生成済みの場合はスキップ):
   ```bash
   npm install
   node create-icons.js
   ```

3. **Chromeで拡張機能をロード**:
   - Chromeを開き、`chrome://extensions/` にアクセス
   - 右上の「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - このリポジトリのフォルダを選択

4. **Holodexにアクセス**:
   - [https://holodex.net](https://holodex.net) を開く
   - 拡張機能アイコンをクリックして設定を確認

## 📖 使い方

### 基本的な使い方

1. **拡張機能アイコンをクリック** - Chrome ツールバーの拡張機能アイコン(紫色のグラデーション)をクリックします。

2. **画質を選択**:
   - 4K (2160p) - 超高画質(高速回線が必要)
   - 1440p - 非常に高画質
   - **1080p (Full HD)** - 高画質(推奨)
   - 720p (HD) - 標準画質
   - 480p - 中画質
   - 360p - 低画質(デフォルト)

3. **設定を適用** - 「設定を適用してリロード」ボタンをクリックします。

4. **ページが自動的にリロード** - 新しい設定が適用されます。

### 高度な使い方

#### デバッグ情報の確認

ブラウザのデベロッパーツール(F12)を開き、コンソールタブで以下のメッセージを確認できます:

```
[Holodex Quality Enhancer] Content script loaded
[Holodex Quality Enhancer] Enhanced iframe: https://www.youtube.com/embed/...
[Holodex Quality Enhancer] YouTube IFrame API ready
[Holodex Quality Enhancer] Creating YouTube player: ...
[Holodex Quality Enhancer] Player ready: ...
```

#### 手動で画質を変更

コンソールで以下のコマンドを実行することで、すべてのプレイヤーの画質を手動で変更できます:

```javascript
// すべてのプレイヤーを1080pに設定
setHolodexQuality('hd1080');

// 4Kに設定
setHolodexQuality('hd2160');
```

#### 現在の設定を確認

```javascript
// 拡張機能の設定を確認
console.log(window.holodexQualityEnhancer.settings);

// 管理されているプレイヤーの一覧
console.log(window.holodexQualityEnhancer.players);
```

## ⚠️ 制限事項と注意点

### YouTube APIの制限

YouTubeは外部からの画質制御APIを無効化しているため、以下の制限があります:

1. **画質が変更されない場合がある** - YouTube側の制限により、必ずしも指定した画質になるとは限りません。
2. **ネットワーク速度の影響** - 回線速度が遅い場合、YouTubeが自動的に低画質を選択します。
3. **動画の利用可能な画質** - すべての動画で高画質が利用できるわけではありません。

### 回避方法

画質が変更されない場合は、以下の方法を試してください:

1. **全画面表示を使用**:
   - プレイヤーを全画面表示にする
   - YouTubeの画質設定メニューから手動で画質を選択
   - 全画面を解除(設定は維持されます)

2. **プレイヤーサイズを大きくする**:
   - Holodexのマルチビューレイアウトで、動画セルを大きくする
   - シアターモードを使用する

3. **拡張機能を再読み込み**:
   - `chrome://extensions/` で拡張機能をリロード
   - Holodexページをリフレッシュ

## 🛠️ 開発

### ファイル構成

```
high-qualirize-holodex/
├── manifest.json           # 拡張機能のマニフェストファイル
├── content.js              # コンテンツスクリプト(Holodexページに注入)
├── injected.js             # ページコンテキストで実行されるスクリプト
├── popup.html              # 拡張機能ポップアップUI
├── popup.js                # ポップアップのロジック
├── create-icons.js         # アイコン生成スクリプト
├── icons/
│   ├── icon16.png         # 16x16アイコン
│   ├── icon48.png         # 48x48アイコン
│   ├── icon128.png        # 128x128アイコン
│   └── icon.svg           # SVGソース
├── package.json            # npm依存関係
└── README.md               # このファイル
```

### ローカル開発

1. **依存関係のインストール**:
   ```bash
   npm install
   ```

2. **アイコンの再生成**:
   ```bash
   node create-icons.js
   ```

3. **変更を反映**:
   - `chrome://extensions/` で拡張機能のリロードボタンをクリック
   - Holodexページをリフレッシュ

### コードの変更

- **画質パラメータの調整**: `content.js` の `modifyYouTubeIframe()` 関数
- **プレイヤーサイズの変更**: `content.js` の `settings` オブジェクト
- **UIのカスタマイズ**: `popup.html` と `popup.js`
- **YouTube Player APIの制御**: `injected.js` の `trySetQuality()` 関数

## 📚 参考資料

### YouTube IFrame API

- [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube Player Parameters](https://developers.google.com/youtube/player_parameters)
- [YouTube Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)

### Holodex

- [Holodex Website](https://holodex.net)
- [Holodex GitHub Repository](https://github.com/HolodexNet/Holodex)
- [Holodex Issue #105 - Video Quality Control](https://github.com/HolodexNet/Holodex/issues/105)

### Chrome拡張機能開発

- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)

## 🤝 コントリビューション

このプロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

MIT License

## 🙏 謝辞

- [Holodex](https://holodex.net) - 素晴らしいVTuberストリーミングプラットフォーム
- [HolodexNet](https://github.com/HolodexNet) - オープンソースプロジェクト
- YouTube IFrame API - 動画埋め込みAPI

## 📧 お問い合わせ

問題や質問がある場合は、[GitHubのIssues](https://github.com/shirota773/high-qualirize-holodex/issues)で報告してください。

---

**注意**: この拡張機能は非公式のファンメイドプロジェクトであり、HolodexやYouTubeとは関係ありません。
