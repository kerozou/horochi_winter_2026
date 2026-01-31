#!/bin/bash

# エラー時に即座に終了
set -e

# デバッグモード（各コマンドを実行前に表示）
set -x

# .envファイルのパスを指定して読み込む
ENV_FILE_PATH="../../.env"
if [ -f "$ENV_FILE_PATH" ]; then
  echo "Loading environment variables from $ENV_FILE_PATH..."
  # コメント行と空行を除外して環境変数を読み込む
  export $(grep -v '^#' "$ENV_FILE_PATH" | grep -v '^$' | xargs)
  echo "Environment variables loaded."
else
  echo "Warning: .env file not found at $ENV_FILE_PATH"
fi

# S3バケット名とCloudFrontディストリビューションIDを環境変数から取得
BUCKET_NAME=${BUCKET_NAME}
DISTRIBUTION_ID=${DISTRIBUTION_ID}

# 環境変数が設定されていることを確認
if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
  echo "Error: BUCKET_NAME and DISTRIBUTION_ID must be set in the .env file."
  echo "BUCKET_NAME: $BUCKET_NAME"
  echo "DISTRIBUTION_ID: $DISTRIBUTION_ID"
  exit 1
fi

echo "BUCKET_NAME: $BUCKET_NAME"
echo "DISTRIBUTION_ID: $DISTRIBUTION_ID"

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

# AWS CLIがインストールされているか確認
if ! command -v aws &> /dev/null; then
  echo "Error: AWS CLI is not installed or not in PATH."
  exit 1
fi

# AWS認証情報が設定されているか確認
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
  echo "Error: AWS credentials are not configured. Please run 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  exit 1
fi
echo "AWS credentials are valid."

# ルートディレクトリの必要なファイルとディレクトリをS3バケットのルートに同期
# infra, node_modules, .gitなどを除外
echo "Uploading root files and directories to s3://$BUCKET_NAME/..."
echo "This may take a while depending on the number of files..."
aws s3 sync "$ROOT_DIR" "s3://$BUCKET_NAME/" \
  --exclude "infra/*" \
  --exclude "node_modules/*" \
  --exclude ".git/*" \
  --exclude ".env*" \
  --exclude "*.md" \
  --exclude "package*.json" \
  --exclude "resources/*" \
  --delete \
  --no-progress

if [ $? -ne 0 ]; then
  echo "Error: Failed to upload root files to S3."
  exit 1
fi
echo "Root files uploaded successfully."

# resourcesディレクトリ全体をS3バケットのresources/パスに同期（サブディレクトリも含む）
# --excludeで.gitignoreとREADME.mdを除外
echo "Uploading files from $RESOURCES_DIR to s3://$BUCKET_NAME/resources/..."
echo "This may take a while depending on the number of files..."
aws s3 sync "$RESOURCES_DIR" "s3://$BUCKET_NAME/resources/" \
  --exclude ".gitignore" \
  --exclude "README.md" \
  --delete \
  --no-progress

if [ $? -ne 0 ]; then
  echo "Error: Failed to upload files to S3."
  exit 1
fi
echo "Resources files uploaded successfully."

# CloudFrontディストリビューションのキャッシュを削除
echo "Invalidating CloudFront cache..."
INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" 2>&1)

if [ $? -ne 0 ]; then
  echo "Warning: Failed to invalidate CloudFront cache, but upload completed."
  echo "Error output: $INVALIDATION_OUTPUT"
else
  echo "CloudFront cache invalidation initiated."
  echo "$INVALIDATION_OUTPUT"
fi

echo "Upload and cache invalidation completed successfully."