## upload_to_s3.shの扱い方など
- `/infra/CDK/lib/StaticSiteStack.ts` によってAWS S3 bucketが作成される仕組みになっています
  - CDKによる初回デプロイ時にbucketが作成されるので、`upload_to_s3.sh` 等により該当バケットの中にデータを入れてください
- ルートディレクトリ直下に `.env.example` を参考にして、`.env` ファイルを作成してください
- `aws configure`で接続先アカウントを設定したうえで、`/infra/Scripts` の中で `$ bash upload_to_s3.sh` を実行することで`/frontend/resources`内部のファイルがS3 bucketにデータが転送されます
- データ転送後に、S3オリジンに紐づいているCloudfront distributionのキャッシュも削除されるように設定しています
