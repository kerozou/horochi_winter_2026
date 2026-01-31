# バックエンドAPI接続設定

## デプロイ後の設定手順

### 1. API GatewayのエンドポイントURLを取得

BackendStackをデプロイすると、以下のような出力が表示されます：

```
BackendStack.ApiUrl = https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
```

このURLをコピーしてください。

### 2. index.htmlにAPI URLを設定

`index.html`ファイルを開き、以下の行を更新してください：

```html
<script>
    // API GatewayのエンドポイントURLを設定
    window.API_BASE_URL = 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod';
</script>
```

`xxxxxxxxxx`の部分を、デプロイ時に表示された実際のAPI Gateway IDに置き換えてください。

### 3. 環境別の設定

#### 開発環境（ローカル）

開発環境では、`window.API_BASE_URL`を設定しないでください。デフォルトで`http://localhost:3000`が使用されます。

#### 本番環境

本番環境では、デプロイ後のAPI Gateway URLを設定してください。

### 4. 確認方法

ブラウザの開発者ツール（F12）のコンソールで、以下のコマンドを実行して設定を確認できます：

```javascript
console.log(window.API_BASE_URL);
```

または、ゲーム内でAPI接続を試みて、正常に動作することを確認してください。

## 現在の設定方法

現在、APIのベースURLは以下の優先順位で決定されます：

1. `window.API_BASE_URL`（`index.html`で設定）
2. `gameConfig.js`の`api.baseUrl`（デフォルト: `http://localhost:3000`）

## 注意事項

- API GatewayのURLは、デプロイするたびに変更される可能性があります
- ステージ（`dev`、`staging`、`prod`）ごとに異なるURLが生成されます
- CORS設定は`BackendStack.ts`で既に設定されています（`allowOrigins: Cors.ALL_ORIGINS`）

## トラブルシューティング

### API接続エラーが発生する場合

1. `window.API_BASE_URL`が正しく設定されているか確認
2. API GatewayのURLが正しいか確認（末尾に`/prod`や`/dev`が含まれているか）
3. ブラウザのコンソールでエラーメッセージを確認
4. CORSエラーが発生している場合は、`BackendStack.ts`のCORS設定を確認

### オフラインモードが表示される場合

API接続に失敗すると、自動的にオフラインモード（ローカルストレージ）にフォールバックします。これは正常な動作です。

