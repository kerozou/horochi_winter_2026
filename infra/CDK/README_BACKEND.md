# BackendStack デプロイガイド

## 必要な環境変数

`BackendStack`を使用するために、プロジェクトルート（`horochi_winter_2026/.env`）に以下の環境変数を設定してください。

### 必須項目

```env
# AWSアカウントID
CDK_DEFAULT_ACCOUNT=123456789012

# AWSリージョン
CDK_DEFAULT_REGION=ap-northeast-1
```

### オプション項目（デフォルト値あり）

```env
# 環境ステージ（デフォルト: dev）
# dev, staging, prod など
STAGE=dev

# JWT秘密鍵（デフォルト: 'your-secret-key-change-in-production'）
# ⚠️ 本番環境では必ず強力な秘密鍵に変更してください
JWT_SECRET=your-secret-key-change-in-production

# サービス名（オプション）
# スタック名のプレフィックスとして使用されます
# 設定しない場合は 'BackendStack' という名前になります
SERVICE_NAME=horochi-winter-2026
```

## 環境変数の説明

### `CDK_DEFAULT_ACCOUNT`（必須）
- AWSアカウントIDを指定します
- 例: `123456789012`

### `CDK_DEFAULT_REGION`（必須）
- AWSリージョンを指定します
- `BackendStack`のデフォルトは `ap-northeast-1`（東京リージョン）
- 例: `ap-northeast-1`, `us-east-1` など

### `STAGE`（オプション）
- 環境ステージを指定します
- テーブル名や関数名に使用されます
- 例: `dev`, `staging`, `prod`
- デフォルト: `dev`

### `JWT_SECRET`（オプション）
- JWTトークンの署名に使用する秘密鍵
- **本番環境では必ず強力なランダム文字列に変更してください**
- デフォルト: `your-secret-key-change-in-production`

### `SERVICE_NAME`（オプション）
- スタック名のプレフィックスとして使用されます
- 複数のサービスを同じAWSアカウントで管理する場合に便利です
- 例: `SERVICE_NAME=horochi-winter-2026` の場合、スタック名は `horochi-winter-2026-BackendStack` になります

## セットアップ手順

1. `.env.example`をコピーして`.env`ファイルを作成：

```bash
cp .env.example .env
```

2. `.env`ファイルを編集して、必要な値を設定：

```bash
# エディタで開く
nano .env
# または
code .env
```

3. AWS認証情報を設定（AWS CLIを使用）：

```bash
aws configure
```

4. CDKをブートストラップ（初回のみ）：

```bash
cd infra/CDK
cdk bootstrap
```

5. スタックをデプロイ：

```bash
cd infra/CDK
npm run build
cdk deploy BackendStack --stage dev
```

## 注意事項

- `.env`ファイルは`.gitignore`に追加して、Gitにコミットしないでください
- `JWT_SECRET`は本番環境では必ず強力な秘密鍵に変更してください
- `CDK_DEFAULT_ACCOUNT`と`CDK_DEFAULT_REGION`は正しい値を設定してください（間違った値だとデプロイに失敗します）

