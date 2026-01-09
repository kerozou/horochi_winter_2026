# CDKによるリソース管理
- portforio等の静的ページを公開するために使う各種リソースをAWS CDKによって定義します
- ※AWS CertificateManager(ACM)で発行するTLS証明書は、コンソール上で作成したものをARNを参照することで利用しています
- ※cdk.context.jsonはキャッシュ情報を保持しているのでcommitに含めるのが理想ですが、今回はpublicに公開しているためignoreしています

## 実行手順など
- まずは、AWS CDKがローカル環境に導入されていることを確認してください
  - AWS CLIがインストールされていること
  - AWS CLI が設定されていること (`aws configure` コマンドを使用)
  - Node.js と npm がインストールされていること
  - AWS CDK がインストールされていること (`npm install -g aws-cdk`)

- ルートディレクトリ直下に`.env.example`を参考に`.env`を用意します

- `/infra/CDK`ディレクトリ内で、`npm ci`を実行して依存パッケージを取得する
- 下記コマンドを`/infra/CDK`ディレクトリ内で実行することcdk deployが開始されます 
    - `$ npm run build && npm run cdk -- --app="./bin/cdk.js" deploy StaticSiteStack` 

- もしくは、mainブランチにマージされた際にgithub actionsのworkflowによって同様の操作が行われます

## スナップショットテストについて
- Stack定義を変更する前に、事前に`npm test -- -u`を実行して起き、スナップショットを作成しておくことをお勧めします
- CDKのリソース定義(Stack定義)に変更を加えた際には`npm test`を実行し、変更箇所により他リソースへと影響が出ていないかを確認することをお勧めします
- 変更箇所以外に差分が見られないことが確認出来たら、`npm test -- -u`でスナップショットテストの結果を更新して運用することをお勧めします
- githubActions上でも、PRなどをトリガーにしてnpm testやlintなど走るようにしておくとCIが実施できるのでお勧めします