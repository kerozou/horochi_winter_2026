import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

// .envファイルのパスを指定して読み込む
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 環境変数の取得
    const domainName = process.env.DOMAIN_NAME!;
    const subdomainName = process.env.SUBDOMAIN_NAME!;
    const certificateArn = process.env.CERTIFICATE_ARN!;

    // S3 バケットを作成
    // スタック名を含めて一意性を確保（既存の別サービスのバケットと衝突しないように）
    const serviceName = process.env.SERVICE_NAME || '';
    const bucketNamePrefix = serviceName ? `${serviceName}-` : '';
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // バケット名にサービス名を含める（オプション、自動生成される場合は不要）
      // bucketName: `${bucketNamePrefix}static-site-bucket`, // 必要に応じてコメントアウトを解除
    });

    // Route 53 ホストゾーンを取得
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: domainName,
    });

    // CloudFront OAI を作成
    // スタック名が異なれば自動的に一意のIDになるが、明示的にサービス名を含める
    const oai = new cloudfront.OriginAccessIdentity(this, 'SiteOAI', {
      comment: serviceName ? `OAI for ${serviceName}` : 'OAI for Static Site',
    });

    // S3バケットポリシーを設定
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${siteBucket.bucketArn}/*`],
      principals: [new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    }));

    // CloudFront ディストリビューションを作成
    // 注意: 既存のディストリビューションを保護するため、論理IDを一意にし、
    // 既存リソースとの衝突を避ける
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [subdomainName],
      certificate: Certificate.fromCertificateArn(this, 'Certificate', certificateArn),
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, {
          originAccessIdentity: oai,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      // 既存のディストリビューションを誤って削除しないようにする
      // 重要: 既存の別サービスのCloudFrontディストリビューションは
      // 別のスタックで管理することを推奨
    });

    // Route 53 Aレコードを作成
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    // Route 53 AAAAレコードを作成
    new route53.AaaaRecord(this, 'SiteAliasRecordAAAA', {
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    // S3 バケットにファイルをデプロイするためのコマンド等を出力
    // データの更新・管理がしやすいように、デプロイスクリプトをshファイルとして /frontend に分離している
    new cdk.CfnOutput(this, 'BucketName', {value: siteBucket.bucketName});
    new cdk.CfnOutput(this, 'DistributionDomainId', { value: distribution.distributionId });
  }
}