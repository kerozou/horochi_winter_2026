# API接続エラーのトラブルシューティング

## `Failed to fetch`エラーが発生する場合

### 1. API Gatewayのデプロイ状態を確認

以下のコマンドでAPI Gatewayがデプロイされているか確認してください：

```bash
cd infra/CDK
npx cdk list
```

`horochi-winter-2026-BackendStack`が表示されない場合は、デプロイが必要です。

### 2. ヘルスチェックエンドポイントで確認

ブラウザで以下のURLに直接アクセスして、API Gatewayが動作しているか確認してください：

```
https://po5kyeaa68.execute-api.ap-northeast-1.amazonaws.com/prod/health
```

正常な場合、以下のようなJSONレスポンスが返ります：
```json
{"success":true,"data":{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}}
```

### 3. CORSエラーの確認

ブラウザの開発者ツール（F12）のコンソールで、以下のようなCORSエラーが表示されていないか確認してください：

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

CORSエラーが表示される場合：
- `BackendStack.ts`のCORS設定を確認
- API Gatewayのデプロイを再実行

### 4. ネットワークエラーの確認

`Failed to fetch`エラーは、以下の原因で発生する可能性があります：

1. **API Gatewayがデプロイされていない**
   - 解決策: `npx cdk deploy horochi-winter-2026-BackendStack`を実行

2. **URLが間違っている**
   - 確認: `index.html`の`window.API_BASE_URL`が正しいか
   - 確認: ブラウザのコンソールで`API Request URL:`を確認

3. **CORS設定の問題**
   - 確認: `BackendStack.ts`の`defaultCorsPreflightOptions`が正しく設定されているか
   - 確認: Lambda関数のレスポンスヘッダーにCORSヘッダーが含まれているか

4. **Lambda関数のエラー**
   - 確認: CloudWatch LogsでLambda関数のエラーログを確認

### 5. デバッグ手順

1. ブラウザの開発者ツール（F12）を開く
2. ネットワークタブで、失敗したリクエストを確認
3. リクエストの詳細（URL、ヘッダー、ステータスコード）を確認
4. レスポンスタブで、エラーメッセージを確認

### 6. よくある問題と解決策

#### 問題: `/health`エンドポイントが404を返す

**原因**: `/health`エンドポイントがデプロイされていない

**解決策**: 
1. `BackendStack.ts`に`/health`エンドポイントが追加されているか確認
2. `npx cdk deploy horochi-winter-2026-BackendStack`を再実行

#### 問題: CORSエラーが発生する

**原因**: CORS設定が正しく適用されていない

**解決策**:
1. `BackendStack.ts`の`defaultCorsPreflightOptions`を確認
2. Lambda関数のレスポンスヘッダーにCORSヘッダーが含まれているか確認
3. API Gatewayのデプロイを再実行

#### 問題: `Missing Authentication Token`エラー

**原因**: ルートパス（`/`）にアクセスしている

**解決策**: 正しいエンドポイント（例: `/health`、`/auth/login`）にアクセスする

### 7. 確認コマンド

```bash
# API Gatewayの状態を確認
aws apigateway get-rest-apis --query "items[?name=='horochi-winter-2026-backend-dev']"

# Lambda関数の状態を確認
aws lambda list-functions --query "Functions[?contains(FunctionName, 'horochi-winter-2026-backend')]"

# CloudWatch Logsでエラーを確認
aws logs tail /aws/lambda/horochi-winter-2026-backend-dev-login --follow
```

