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

## Tauri（デスクトップアプリとして起動）する手順

1. 依存関係を入れる（未実施のときだけ）  
   `npm ci`
2. Tauri で起動する  
   `npm run tauri:dev`  
   ウィンドウにゲームが表示されます。

※ 現在の Tauri 版は Steam 連携を無効化した構成です。Steamworks（App ID、実績、SteamPipe 配布）の情報は **[docs/STEAM.md](docs/STEAM.md)** に残していますが、Electron 前提の内容です。

---

## 配布用ビルド（Tauri）の手順

インストーラや実行ファイルを作り、他の PC に配るための手順です。成果物は主に **`src-tauri/target/release/bundle/`** に出力されます（このフォルダは Git に含めません）。

### 1. 依存関係を入れる

```bash
npm ci
```

### 2. OS に応じてビルドコマンドを実行する

| やりたいこと | 実行するコマンド | 備考 |
|--------------|------------------|------|
| 今使っている OS 向けに自動でビルド | `npm run dist` | |
| Windows 用（NSIS） | `npm run dist:win` | 基本的に **Windows 上** で実行 |
| macOS 用（DMG） | `npm run dist:mac` | **macOS 上** で実行すること |
| Linux 用（AppImage） | `npm run dist:linux` | **Linux 上** で実行すること |

### 3. 成果物を確認する

- ビルドが終わると **`src-tauri/target/release/bundle/`** にインストーラ（`.exe` など）が生成されます。
- **初回**は Rust の依存取得が走るため、時間がかかることがあります。

### 4. バージョンや表示名を変えたいとき

- アプリのバージョン: `package.json` の `"version"`
- アプリ名・識別子: `src-tauri/tauri.conf.json` の `productName` と `identifier`

### 5. コード署名について

- 証明書を設定していない場合は **未署名** のビルドになります（実行時に OS の警告が出ることがあります）。
- 本番配布で警告を減らすには、Windows の Authenticode や macOS の公証など、各 OS の手順を別途用意します。

---

## Windows で Tauri ビルドが失敗するとき

- Rust ツールチェーン未導入のことが多いため、`rustup` と `Microsoft C++ Build Tools` の導入を確認してください。
- 詳細は Tauri 公式の prerequisite ガイドを参照してください。

---

## アイコン（任意）

現在は `src-tauri/icons/icon.png` を使用しています。差し替える場合は Tauri のアイコン形式（`png` / `ico` / `icns`）を用意して `src-tauri/tauri.conf.json` で設定してください。

---

## その他のドキュメント

- トラブルシュート: `TROUBLESHOOTING.md`
- API 設定: `API_CONFIG.md`
