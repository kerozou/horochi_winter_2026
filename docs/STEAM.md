# Steam 配布（Steamworks + Electron）

このプロジェクトは **[steamworks.js](https://github.com/ceifa/steamworks.js)** で Steamworks API を呼び出します（メインプロセスのみ。ゲーム本体は `preload` 経由の `window.steamBridge`）。

## 事前準備（Valve）

1. [Steamworks パートナー](https://partner.steamgames.com/) に登録し、**Steam Direct** でアプリを作成する。
2. **App ID** を取得する（ダッシュボードに表示される数値）。
3. 同じ画面で **実績（Achievements）** を作成し、**API Name**（英数字）を決める（例: `ACH_FIRST_PLAY`）。

## このリポジトリでの設定

### `steam_appid.txt`

プロジェクト直下の **`steam_appid.txt`** に **あなたの App ID** を1行で書く（末尾改行可）。

- 未設定のままだとサンプルとして **480**（Valve のテスト用 [Spacewar](https://partner.steamgames.com/doc/sdk/api)）が使われます。開発時は Steam クライアントで Spacewar を所有している必要があります。
- 本番ビルドでは `electron-builder` の **extraFiles** により、実行ファイルと同じフォルダにコピーされます。

### 環境変数（任意）

| 変数 | 内容 |
|------|------|
| `STEAM_OVERLAY=1` | Steam オーバーレイを有効化しようとする（一部環境で不安定な報告あり） |

### ゲームから実績を解除する例

```js
import { tryUnlockSteamAchievement } from './utils/steamBridge.js';

// Steam パートナーで設定した API Name と一致させる
await tryUnlockSteamAchievement('ACH_FIRST_PLAY');
```

ブラウザ（horochi.click など）では `window.steamBridge` が無いため **何も起きません**。

## ビルド・配布

1. `npm ci`
2. `npm run dist:win`（または対象 OS）
3. 生成物に **`steam_api64.dll`** などは `steamworks.js` の npm 同梱物が含まれます（`asarUnpack` 済み）。
4. SteamPipe でアップロードする depots には、**electron-builder の出力一式**（＋必要なら `steam_appid.txt` が exe 隣にあること）を含めます。

## 注意

- **Web 版と Steam 版**で挙動が分かれるため、実績は「Steam だけ」「自前トロフィーだけ」など方針を決めるとよいです。
- コード署名・Steam の追加要件は Valve のドキュメントに従ってください。
