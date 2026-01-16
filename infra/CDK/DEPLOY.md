# BackendStack デプロイ手順

## 前提条件

1. AWS CLIがインストールされ、認証情報が設定されていること
2. `.env`ファイルがプロジェクトルートに存在し、必要な環境変数が設定されていること

## デプロイ手順

### 1. 環境変数の確認

プロジェクトルート（`horochi_winter_2026/.env`）に以下の環境変数が設定されていることを確認してください：

```env
CDK_DEFAULT_ACCOUNT=123456789012  # あなたのAWSアカウントID
CDK_DEFAULT_REGION=ap-northeast-1  # デプロイ先リージョン
STAGE=dev  # 環境ステージ（dev, staging, prodなど）
JWT_SECRET=your-secret-key-change-in-production  # JWT秘密鍵（本番環境では強力な鍵に変更）
SERVICE_NAME=horochi-winter-2026  # オプション：スタック名のプレフィックス
```

### 2. 依存関係のインストール

```bash
cd infra/CDK
npm install
```

### 3. バックエンドの依存関係のインストール

```bash
cd ../../backend
npm install --production
cd ../infra/CDK
```

### 4. TypeScriptのビルド

```bash
npm run build
```

### 5. CDKブートストラップ（初回のみ）

初回デプロイ時のみ、CDKブートストラップを実行します：

```bash
npx cdk bootstrap
```

### 6. デプロイ

```bash
npx cdk deploy horochi-winter-2026-BackendStack
```

または、環境変数`SERVICE_NAME`が設定されている場合：

```bash
npx cdk deploy --stack-name horochi-winter-2026-BackendStack
```

## トラブルシューティング

### Dockerエラーが発生する場合

Windows環境でDockerがインストールされていない場合、`BackendStack.ts`の`bundling`オプションは既に削除されています。`backend`ディレクトリ全体がアセットとして使用されます。

### AWS_REGIONエラーが発生する場合

`AWS_REGION`はLambdaランタイムによって自動的に設定されるため、環境変数として設定しないでください。既に`BackendStack.ts`から削除されています。

### 認証エラーが発生する場合

AWS CLIの認証情報を確認してください：

```bash
aws configure list
aws sts get-caller-identity
```

## デプロイ後の確認

デプロイが成功すると、以下の出力が表示されます：

- `ApiUrl`: API GatewayのエンドポイントURL
- `UsersTableName`: DynamoDB Usersテーブル名
- `TrophiesTableName`: DynamoDB Trophiesテーブル名
- `FavoritesTableName`: DynamoDB Favoritesテーブル名
- `RankingsTableName`: DynamoDB Rankingsテーブル名

これらの値を`.env`ファイルまたは`gameConfig.js`の`api.baseUrl`に設定してください。

