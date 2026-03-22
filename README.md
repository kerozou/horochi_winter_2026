# ほろっちの冬休み 2026

直感的な操作で、ほろっちと一緒にロケットを作ろう！

## 前提条件

- [Node.js](https://nodejs.org/)（LTS 推奨）と npm が入っていること
- リポジトリをクローンしたら、プロジェクトのルートでコマンドを実行する

## セットアップ（初回・環境を整えるとき）

```bash
git clone <このリポジトリのURL>
cd horochi_winter_2026
npm ci
```

`npm ci` が使えない場合は `npm install` でも構いません。

`npm install` / `npm ci` 実行時に **`postinstall`** で `node_modules/phaser` から **`vendor/phaser.min.js`** がコピーされます。静的ホスティング（S3・CloudFront など）では **`node_modules` をデプロイに含めない**のが普通なので、HTML からは `vendor/phaser.min.js` を参照します。**リポジトリには `vendor/phaser.min.js` をコミットしておく**と、CI で `npm` を走らせずに同期するだけの運用でも動きます。

---

## Web ブラウザで動かす手順

1. 依存関係を入れる（未実施のときだけ）  
   `npm ci`
2. 開発用サーバを起動する  
   `npm run dev`  
   ブラウザが開き、ゲーム画面が表示されます。
3. 終了するときはターミナルで `Ctrl+C` です。

※ 別の方法として `npm run start` でも同様にローカルサーバが立ち上がります（`-o` で自動オープンはしません）。

---

## Electron（デスクトップアプリとして起動）する手順

1. 依存関係を入れる（未実施のときだけ）  
   `npm ci`
2. Electron で起動する  
   `npm run electron`  
   ウィンドウにゲームが表示されます。

---

## 配布用ビルド（electron-builder）の手順

インストーラや実行ファイルを作り、他の PC に配るための手順です。成果物は **`dist-app/`** に出力されます（このフォルダは Git に含めません）。

### 1. 依存関係を入れる

```bash
npm ci
```

### 2. OS に応じてビルドコマンドを実行する

| やりたいこと | 実行するコマンド | 備考 |
|--------------|------------------|------|
| 今使っている OS 向けに自動でビルド | `npm run dist` | |
| Windows 用（NSIS インストーラ・64bit） | `npm run dist:win` | 基本的に **Windows 上** で実行 |
| macOS 用（DMG） | `npm run dist:mac` | **macOS 上** で実行すること |
| Linux 用（AppImage） | `npm run dist:linux` | **Linux 上** で実行すること |

### 3. 成果物を確認する

- ビルドが終わると **`dist-app/`** にインストーラ（`.exe` など）や展開済みフォルダ（例: `win-unpacked`）ができます。
- **初回**は Electron のダウンロードなどがあり、時間がかかることがあります。

### 4. バージョンや表示名を変えたいとき

- アプリのバージョン: `package.json` の `"version"`
- アプリ名・識別子: `package.json` の `build.productName` と `build.appId`

### 5. コード署名について

- 証明書を設定していない場合は**未署名**のビルドになります（実行時に OS の警告が出ることがあります）。
- 本番配布で警告を減らすには、Windows の Authenticode や macOS の公証など、各 OS の手順を別途用意します。

---

## Windows でビルドが失敗するとき（シンボリックリンク / winCodeSign）

`Cannot create symbolic link` と `winCodeSign` の展開で失敗するのは、electron-builder が exe にメタデータを書き込む際に **winCodeSign** を展開し、その中の macOS 用ファイルのシンボリックリンクを Windows が作れない場合に起きます。

このリポジトリでは `package.json` の `build.win.signAndEditExecutable` を **`false`** にして、上記の展開を行わないようにしています（未署名ビルド向けの回避）。そのうえで再度 `npm run dist` を試してください。

それでも同様のエラーになる場合は、次も試せます。

1. **設定** → **システム** → **開発者向け** → **開発者モード** をオンにする
2. **管理者として** PowerShell などを開き、プロジェクトフォルダで `npm run dist:win` を実行する

将来、Windows 用コード署名を本格的に行う場合は `signAndEditExecutable` の扱いを見直す必要があることがあります。

---

## アイコン（任意）

未設定のときは Electron のデフォルトアイコンです。差し替える場合は `package.json` の `build` にアイコンを指定します（例: Windows 用 `.ico` を `resources` に置き、`win.icon` を設定）。

---

## その他のドキュメント

- トラブルシュート: `TROUBLESHOOTING.md`
- API 設定: `API_CONFIG.md`
