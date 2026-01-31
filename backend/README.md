# Horochi Winter 2026 Backend

バックエンドAPIサーバー（AWS API Gateway + Lambda + DynamoDB）

## 機能

- ユーザー認証（ログイン・登録）
- トロフィーデータの保存・取得
- エディタのお気に入り情報の保存・取得・削除

## アーキテクチャ

- **API Gateway**: REST APIエンドポイント
- **Lambda**: サーバーレス関数
- **DynamoDB**: NoSQLデータベース
- **アダプタパターン**: DB接続先を切り替え可能

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成（または環境変数を設定）：

```env
JWT_SECRET=your-secret-key-change-in-production
DB_ADAPTER=dynamodb  # または 'json' (開発用)
AWS_REGION=ap-northeast-1
```

### 3. ローカル開発（JSONアダプタ使用）

```bash
# 環境変数を設定
export DB_ADAPTER=json
export JSON_DATA_DIR=./data

# サーバーレスオフラインで起動
npm run offline
```

### 4. AWSへのデプロイ

```bash
# AWS認証情報を設定
aws configure

# デプロイ
npm run deploy

# 特定のステージでデプロイ
npm run deploy -- --stage prod
```

## APIエンドポイント

### 認証

- `POST /auth/register` - ユーザー登録
  - リクエストボディ: `{ "userId": "ABC12" (オプション), "password": "password", "email": "email@example.com" (オプション) }`
  - userIdが指定されていない場合は自動生成（5文字の大文字英数字）
  - レスポンス: `{ "success": true, "data": { "user": {...}, "token": "..." } }`
  
- `POST /auth/login` - ログイン
  - リクエストボディ: `{ "userId": "ABC12", "password": "password" }`
  - レスポンス: `{ "success": true, "data": { "user": {...}, "token": "..." } }`
  
- `GET /auth/user` - ユーザー情報取得（認証必要）
  - ヘッダー: `Authorization: Bearer <token>`
  - レスポンス: `{ "success": true, "data": { "userId": "ABC12", ... } }`

### トロフィー

- `GET /trophies` - トロフィーデータ取得（認証必要）
- `PUT /trophies` - トロフィーデータ更新（認証必要）

### お気に入り

- `GET /favorites` - お気に入り一覧取得（認証必要）
- `POST /favorites` - お気に入り保存（認証必要）
- `DELETE /favorites/{id}` - お気に入り削除（認証必要）

## データベースアダプタ

### DynamoDBアダプタ（本番環境）

環境変数 `DB_ADAPTER=dynamodb` で使用

### JSONファイルアダプタ（開発環境）

環境変数 `DB_ADAPTER=json` で使用。`./data` ディレクトリにJSONファイルで保存されます。

## データモデル

### User

```json
{
  "userId": "ABC12",
  "username": "ABC12",
  "email": "player1@example.com",
  "passwordHash": "...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**注意**: ユーザーIDは5文字の大文字英数字（A-Z, 0-9）で、DBのキーとして使用されます。

### Trophy

```json
{
  "userId": "ABC12",
  "unlockedTrophies": ["trophy_1", "trophy_2"],
  "collectedShibou": [1, 2, 3],
  "playCount": 10,
  "rankCounts": {
    "1": 1,
    "2": 0,
    "3": 0
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Favorite

```json
{
  "favoriteId": "fav_1234567890_abc",
  "userId": "ABC12",
  "name": "My Rocket Design",
  "design": { ... },
  "placedParts": [ ... ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 開発

### テスト

```bash
npm test
```

### ログ確認

```bash
# CloudWatch Logs
aws logs tail /aws/lambda/horochi-winter-2026-backend-dev-login --follow
```

## ライセンス

MIT

