#!/bin/bash

# .envファイルのパスを指定して読み込む
ENV_FILE_PATH="../../.env"
if [ -f "$ENV_FILE_PATH" ]; then
  # コメント行と空行を除外して環境変数を読み込む
  export $(grep -v '^#' "$ENV_FILE_PATH" | grep -v '^$' | xargs)
fi

# S3バケット名とCloudFrontディストリビューションIDを環境変数から取得
BUCKET_NAME=${BUCKET_NAME}
DISTRIBUTION_ID=${DISTRIBUTION_ID}

# 環境変数が設定されていることを確認
if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
  echo "Error: BUCKET_NAME and DISTRIBUTION_ID must be set in the .env file."
  exit 1
fi

# アップロードするディレクトリを指定
RESOURCES_DIR="../../resources"
ROOT_DIR="../.."

# ディレクトリが存在することを確認
if [ ! -d "$RESOURCES_DIR" ]; then
  echo "Error: Resources directory $RESOURCES_DIR does not exist."
  exit 1
fi

if [ ! -d "$ROOT_DIR" ]; then
  echo "Error: Root directory $ROOT_DIR does not exist."
  exit 1
fi

# ルートディレクトリの必要なファイルとディレクトリをS3バケットのルートに同期
# infra, node_modules, .gitなどを除外
echo "Uploading root files and directories to s3://$BUCKET_NAME/..."
aws s3 sync "$ROOT_DIR" "s3://$BUCKET_NAME/" \
  --exclude "infra/*" \
  --exclude "node_modules/*" \
  --exclude ".git/*" \
  --exclude ".env*" \
  --exclude "*.md" \
  --exclude "package*.json" \
  --exclude "resources/*" \
  --delete

if [ $? -ne 0 ]; then
  echo "Error: Failed to upload root files to S3."
  exit 1
fi

# resourcesディレクトリ全体をS3バケットのresources/パスに同期（サブディレクトリも含む）
# --excludeで.gitignoreとREADME.mdを除外
echo "Uploading files from $RESOURCES_DIR to s3://$BUCKET_NAME/resources/..."
aws s3 sync "$RESOURCES_DIR" "s3://$BUCKET_NAME/resources/" \
  --exclude ".gitignore" \
  --exclude "README.md" \
  --delete

if [ $? -ne 0 ]; then
  echo "Error: Failed to upload files to S3."
  exit 1
fi

# CloudFrontディストリビューションのキャッシュを削除
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"

if [ $? -ne 0 ]; then
  echo "Warning: Failed to invalidate CloudFront cache, but upload completed."
fi

echo "Upload and cache invalidation completed."