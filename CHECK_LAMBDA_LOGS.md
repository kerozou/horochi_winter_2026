# Lambda関数のエラーログ確認方法

## 502 Bad Gatewayエラーの原因

502エラーは、API GatewayからLambda関数への接続に問題があることを示します。通常、Lambda関数でエラーが発生している可能性が高いです。

## CloudWatch Logsでエラーを確認

### 1. AWSコンソールで確認

1. AWSコンソールにログイン
2. CloudWatch → Log groups に移動
3. 以下のロググループを確認：
   - `/aws/lambda/horochi-winter-2026-backend-dev-login`
   - `/aws/lambda/horochi-winter-2026-backend-dev-register`
   - など

### 2. AWS CLIで確認

```bash
# 最新のログを確認
aws logs tail /aws/lambda/horochi-winter-2026-backend-dev-login --follow

# または、特定の時間範囲のログを確認
aws logs filter-log-events \
  --log-group-name /aws/lambda/horochi-winter-2026-backend-dev-login \
  --start-time $(date -d '1 hour ago' +%s)000
```

### 3. よくあるエラー

#### エラー: `Cannot find module`
- **原因**: 依存関係が不足している
- **解決策**: `backend`ディレクトリで`npm install --production`を実行し、再デプロイ

#### エラー: `Handler 'src/handlers/user.login' is missing on module`
- **原因**: ハンドラーのパスが間違っている
- **解決策**: `BackendStack.ts`のハンドラーパスを確認

#### エラー: `AccessDeniedException` または DynamoDB関連のエラー
- **原因**: Lambda関数のIAMロールに権限がない
- **解決策**: `BackendStack.ts`のIAMロール設定を確認

#### エラー: `Timeout` または `Task timed out`
- **原因**: Lambda関数のタイムアウト時間が短すぎる
- **解決策**: `BackendStack.ts`の`timeout`設定を増やす

## デプロイ後の確認

デプロイ後、以下のコマンドでLambda関数の状態を確認できます：

```bash
# Lambda関数の一覧を確認
aws lambda list-functions --query "Functions[?contains(FunctionName, 'horochi-winter-2026-backend')]"

# 特定のLambda関数の設定を確認
aws lambda get-function --function-name horochi-winter-2026-backend-dev-login
```

## トラブルシューティング手順

1. CloudWatch Logsでエラーメッセージを確認
2. エラーメッセージに基づいて原因を特定
3. 必要に応じてコードを修正
4. 再デプロイ: `npx cdk deploy horochi-winter-2026-BackendStack`

