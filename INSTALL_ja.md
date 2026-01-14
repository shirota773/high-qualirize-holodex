# インストールガイド

## 📦 簡単インストール手順

### 1. リポジトリのダウンロード

このリポジトリを任意の場所にダウンロードまたはクローンします:

```bash
# Gitを使用する場合
git clone https://github.com/shirota773/high-qualirize-holodex.git
cd high-qualirize-holodex
```

または、GitHubの「Code」→「Download ZIP」からZIPファイルをダウンロードして解凍します。

### 2. Chromeに拡張機能をインストール

1. **Google Chromeを開く**

2. **拡張機能管理ページを開く**
   - アドレスバーに `chrome://extensions/` と入力してEnter
   - または、メニュー(⋮) → その他のツール → 拡張機能

3. **デベロッパーモードを有効化**
   - 右上の「デベロッパーモード」トグルをONにする

4. **拡張機能を読み込む**
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - ダウンロードした `high-qualirize-holodex` フォルダを選択
   - 「フォルダーの選択」をクリック

5. **インストール完了!**
   - 拡張機能一覧に「Holodex Video Quality Enhancer」が表示されます
   - ツールバーに紫色のグラデーションアイコンが表示されます

### 3. Holodexで使用

1. **Holodexを開く**
   - [https://holodex.net](https://holodex.net) にアクセス

2. **拡張機能の設定**
   - ツールバーの拡張機能アイコン(紫色)をクリック
   - 希望の画質を選択(推奨: 1080p)
   - 「設定を適用してリロード」をクリック

3. **動画視聴**
   - ページがリロードされ、設定が適用されます
   - MultiViewなどで複数の動画を高画質で楽しめます!

## 🔧 トラブルシューティング

### 拡張機能が表示されない

- デベロッパーモードが有効になっているか確認
- 正しいフォルダ(manifest.jsonがあるフォルダ)を選択したか確認
- Chromeを再起動してみる

### 画質が変わらない

以下を試してください:

1. **拡張機能を確認**
   - 拡張機能アイコンをクリック
   - 「拡張機能は有効です」と表示されているか確認

2. **ページをリロード**
   - F5キーまたはブラウザのリロードボタン
   - Ctrl+Shift+R で完全リロード

3. **全画面モードで手動設定**
   - プレイヤーを全画面表示
   - YouTubeの設定メニューから画質を選択
   - 全画面を解除

4. **デベロッパーツールで確認**
   - F12キーを押してコンソールを開く
   - `[Holodex Quality Enhancer]` というメッセージが表示されているか確認

### アイコンが表示されない

アイコンが正しく生成されていない可能性があります:

```bash
# リポジトリのフォルダで実行
npm install
node create-icons.js
```

その後、`chrome://extensions/` で拡張機能をリロードしてください。

## 📱 動作環境

- **ブラウザ**: Google Chrome 88以降
- **OS**: Windows, macOS, Linux
- **必須**: Holodex.net へのアクセス

## ⚙️ 高度な設定

### 最小プレイヤーサイズのカスタマイズ

`content.js` の `settings` オブジェクトを編集:

```javascript
let settings = {
  targetQuality: 'hd1080',
  minPlayerWidth: 1280,    // この値を変更
  minPlayerHeight: 720,    // この値を変更
  enabled: true
};
```

変更後、`chrome://extensions/` で拡張機能をリロードしてください。

### デバッグモード

F12キーでデベロッパーツールを開き、以下のコマンドを実行:

```javascript
// 現在の設定を確認
console.log(window.holodexQualityEnhancer.settings);

// すべてのプレイヤーを確認
console.log(window.holodexQualityEnhancer.players);

// 手動で画質を変更
setHolodexQuality('hd1080');
```

## 🆘 サポート

問題が解決しない場合は、以下の情報と共にGitHubのIssuesで報告してください:

- 使用しているChromeのバージョン
- 操作手順
- デベロッパーツールのコンソールに表示されているエラーメッセージ
- スクリーンショット(可能であれば)

[Issues を開く](https://github.com/shirota773/high-qualirize-holodex/issues)
