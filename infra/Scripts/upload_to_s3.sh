#!/bin/bash

# .envファイルのパスを指定して読み込む
ENV_FILE_PATH="../../.env"
if [ -f "$ENV_FILE_PATH" ]; then
  export $(cat "$ENV_FILE_PATH" | xargs)
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
UPLOAD_DIR="../../frontend/resources"

# .gitignoreとREADME.md以外のファイルをS3バケットにアップロード
find "$UPLOAD_DIR" -maxdepth 1 -type f ! -name ".gitignore" ! -name "README.md" -exec aws s3 cp {} "s3://$BUCKET_NAME/" \;

# CloudFrontディストリビューションのキャッシュを削除
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"

echo "Upload and cache invalidation completed."