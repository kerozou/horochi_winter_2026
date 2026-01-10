## upload_to_s3.shの扱い方など
- `/infra/CDK/lib/StaticSiteStack.ts` によってAWS S3 bucketが作成される仕組みになっています
  - CDKによる初回デプロイ時にbucketが作成されるので、`upload_to_s3.sh` 等により該当バケットの中にデータを入れてください
- ルートディレクトリ直下に `.env.example` を参考にして、`.env` ファイルを作成してください
- `aws configure`で接続先アカウントを設定したうえで、`/infra/Scripts` の中で `$ bash upload_to_s3.sh` を実行することで、必要なファイルがS3 bucketにデータが転送されます
- データ転送後に、S3オリジンに紐づいているCloudfront distributionのキャッシュも削除されるように設定しています

## S3にアップロードされるファイルの詳細

### アップロードされるファイル・ディレクトリ

#### ルートディレクトリ（S3バケットのルートに配置）
以下のファイルとディレクトリがS3バケットのルートにアップロードされます：
- `index.html` - メインのHTMLファイル
- `game.js` - ゲームのメインスクリプト
- `config/` - 設定ファイル（例: `gameConfig.js`）
- `domain/` - ドメインロジック（例: `LaunchPoint.js`, `Rocket.js`, `TrajectoryCalculator.js`）
- `entities/` - エンティティクラス（例: `CompositeRocketPart.js`, `RocketDesign.js`, `RocketEntity.js`, `RocketPart.js`）
- `scenes/` - シーンクラス（例: `GameScene.js`, `RocketEditorScene.js`, `TitleScene.js`）
- `utils/` - ユーティリティ関数（例: `gifToSpriteSheet.js`）

#### resourcesディレクトリ（S3バケットの`resources/`パスに配置）
`resources/`ディレクトリの内容が`resources/`パスにアップロードされます：
- 画像ファイル（`.png`, `.gif`など）
- 音声ファイル（`.mp3`, `.wav`, `.ogg`など）
- 動画ファイル（`.mp4`など）
- JSONファイル（`.json`）
- `voice/`サブディレクトリ内の音声ファイル

### 除外されるファイル・ディレクトリ
以下のファイル・ディレクトリはアップロードされません：
- `infra/` - インフラストラクチャ関連ファイル
- `node_modules/` - Node.js依存パッケージ
- `.git/` - Gitリポジトリ情報
- `.env*` - 環境変数ファイル
- `*.md` - Markdownファイル（README.mdなど）
- `package*.json` - パッケージ管理ファイル
- `resources/README.md` - resourcesディレクトリのREADME
- `resources/.gitignore` - resourcesディレクトリの.gitignore

### S3バケット内のパス構造
```
s3://バケット名/
├── index.html
├── game.js
├── config/
│   └── gameConfig.js
├── domain/
│   ├── LaunchPoint.js
│   ├── Rocket.js
│   └── TrajectoryCalculator.js
├── entities/
│   ├── CompositeRocketPart.js
│   ├── RocketDesign.js
│   ├── RocketEntity.js
│   └── RocketPart.js
├── scenes/
│   ├── GameScene.js
│   ├── RocketEditorScene.js
│   └── TitleScene.js
├── utils/
│   └── gifToSpriteSheet.js
└── resources/
    ├── bg_1.png
    ├── bg_2.png
    ├── BGM.mp3
    ├── voice/
    │   ├── 001.wav
    │   ├── 002.wav
    │   └── ...
    └── ...
```

### 注意事項
- `--delete`オプションにより、S3バケット内の既存ファイルでローカルに存在しないファイルは削除されます
- CloudFrontのキャッシュは自動的に無効化されますが、反映まで数分かかる場合があります
